# Kredika Reservation Payload Mapping

## Overview
This document describes how order data is mapped to Kredika's credit reservation API requirements. When a customer chooses to pay via Kredika for a furniture order, the backend collects all necessary information and passes it to Kredika for credit eligibility assessment and installment calculation.

## Complete Payload Structure

### Required Fields in `POST /v1/credits/reservations`

```javascript
{
  partnerId: string,              // Furniture marketplace partner identifier
  externalOrderRef: string,       // Unique order number from e-commerce platform
  externalCustomerRef: string,    // Unique customer identifier (CUST-{userId})
  purchaseAmount: number,         // Total order amount in cents (€100.00 = 10000)
  installmentCount: number,       // Number of monthly installments (e.g., 3, 6, 12)
  notes: string,                  // Description of purchase (optional but recommended)
  totalActiveCredits: number      // Sum of all customer's pending Kredika orders (in cents)
}
```

## Field Mapping Implementation

### 1. **partnerId**
- **Source**: `process.env.KREDIKA_PARTNER_ID`
- **Default**: `'furniture-market-partner'`
- **Purpose**: Identifies the furniture marketplace as a Kredika partner
- **Implementation**: Set in `.env` file and loaded in `kredikaService.js` constructor

```javascript
this.partnerId = process.env.KREDIKA_PARTNER_ID || 'default-partner';
```

---

### 2. **externalOrderRef**
- **Source**: `order.orderNumber` (MongoDB Order document)
- **Format**: Auto-generated unique identifier (e.g., "ORD-20240115-001234")
- **Purpose**: Kredika's reference to match with your system
- **Implementation**: 
```javascript
const externalOrderRef = order.orderNumber;
```

---

### 3. **externalCustomerRef**
- **Source**: `req.user._id` (MongoDB User document ID)
- **Format**: `'CUST-{userId}'` (e.g., "CUST-507f1f77bcf86cd799439011")
- **Purpose**: Kredika's reference to customer profile
- **Implementation**:
```javascript
const externalCustomerRef = `CUST-${req.user._id}`;
```

---

### 4. **purchaseAmount**
- **Source**: `order.pricing.total` (calculated during order creation)
- **Format**: Integer in cents (multiply EUR amount by 100)
- **Components**:
  - Subtotal: Sum of all product prices × quantities
  - Shipping: Free if subtotal ≥ threshold, otherwise standard cost
  - Tax: VAT applied to subtotal (rate set in AdminSettings)
- **Formula**: `Math.round((subtotal + shipping + tax) * 100)`
- **Implementation**:
```javascript
purchaseAmount: Math.round(total * 100) // €150.50 → 15050 cents
```

---

### 5. **installmentCount**
- **Source**: `req.body.installments` (customer selection during checkout)
- **Valid Values**: 1, 2, 3, 4, 6, 12 (or as per Kredika's supported options)
- **Default**: 6 months
- **Purpose**: Tells Kredika how many monthly payments to split the order into
- **Implementation**:
```javascript
installmentCount: installments // e.g., 6 for 6-month installment plan
```

---

### 6. **notes**
- **Source**: Constructed from order details
- **Format**: Human-readable description
- **Content**: Order number + product names for reference
- **Purpose**: Kredika's internal reference note for transaction history
- **Implementation**:
```javascript
notes: `Furniture order ${order.orderNumber} - ${validatedItems.map(i => i.name).join(', ')}`
// Example: "Furniture order ORD-20240115-001234 - Modern Sofa, Coffee Table"
```

---

### 7. **totalActiveCredits**
- **Source**: Aggregation of all pending Kredika orders for the customer
- **Calculation**: `calculateUserActiveCredits(userId)` helper function
- **Formula**: Sum of all pending order totals (method='kredika', status='pending'|'processing')
- **Format**: Integer in cents
- **Purpose**: Kredika needs to know customer's existing credit commitments to assess eligibility
- **Implementation**:
```javascript
// Helper function in orders.js
const calculateUserActiveCredits = async (userId) => {
  const activeOrders = await Order.find({
    user: userId,
    'payment.status': { $in: ['pending', 'processing'] },
    'payment.method': 'kredika'
  });

  const totalActive = activeOrders.reduce((sum, order) => {
    return sum + (order.pricing?.total || 0);
  }, 0);

  return Math.round(totalActive * 100); // Convert to cents
};
```

---

## Complete Flow Diagram

```
Customer Places Order
    ↓
Validate Products & Calculate Pricing
    ↓
Create Order in MongoDB
    ↓
Is Payment Method = 'kredika'?
    ├─ YES:
    │  ├─ Generate externalOrderRef (order.orderNumber)
    │  ├─ Generate externalCustomerRef (CUST-{userId})
    │  ├─ Calculate totalActiveCredits (aggregation query)
    │  ├─ Build complete Kredika payload:
    │  │  ├─ partnerId: from env (furniture-market-partner)
    │  │  ├─ externalOrderRef: order.orderNumber
    │  │  ├─ externalCustomerRef: CUST-{userId}
    │  │  ├─ purchaseAmount: total * 100 (cents)
    │  │  ├─ installmentCount: from request body
    │  │  ├─ notes: "Furniture order {num} - {products}"
    │  │  └─ totalActiveCredits: calculated above
    │  │
    │  ├─ Call kredikaService.createReservation(payload)
    │  │  ├─ Ensure valid OAuth2 token (or use API key auth)
    │  │  ├─ POST /v1/credits/reservations with payload
    │  │  └─ Return creditReservationId + installment details
    │  │
    │  ├─ Store Kredika response in order.payment.kredika
    │  ├─ Reduce product stock quantities
    │  └─ Return order + Kredika reservation details to client
    │
    └─ NO: Process other payment methods (card, etc.)
```

---

## Data Validation Rules

| Field | Min | Max | Required | Type |
|-------|-----|-----|----------|------|
| partnerId | - | - | ✓ | string |
| externalOrderRef | 1 char | 100 chars | ✓ | string (unique) |
| externalCustomerRef | 1 char | 100 chars | ✓ | string (unique) |
| purchaseAmount | 100 | 1,000,000 | ✓ | integer (cents) |
| installmentCount | 1 | 24 | ✓ | integer |
| notes | 0 chars | 500 chars | ✗ | string |
| totalActiveCredits | 0 | ∞ | ✓ | integer (cents) |

---

## Authentication Headers

The payload is sent with proper Kredika authentication headers:

### Development Mode (API Key)
```
X-API-Key: kred_iAEh8HvzkSO9LeYG0yFlVvr3ya7
X-Partner-Key: pk_80b6af62e4ea45f6
Content-Type: application/json
```

### Production Mode (OAuth2)
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```
- Token obtained via POST `/v1/auth/token` with CLIENT_ID/CLIENT_SECRET
- Token auto-refreshes when < 1 minute remaining (30-day refresh token)

---

## Kredika Response Structure

```javascript
{
  creditReservationId: string,    // Unique Kredika reservation ID
  status: 'CREATED'|'PENDING'|..., // Current reservation status
  monthlyPayment: number,         // Monthly payment amount (in cents)
  installments: [                 // Array of installment schedules
    {
      installmentId: string,
      dueDate: ISO8601-date,
      amount: number (cents),
      status: 'PENDING'|'PAID'|...
    }
  ],
  paymentInstructions: {          // How customer should pay
    bankAccount: {...},
    // or
    redirectUrl: string
  }
}
```

---

## Code Location References

- **Payload Mapping**: `src/controllers/orders.js` lines 119-132
- **Helper Function**: `src/controllers/orders.js` lines 8-26
- **Kredika Service**: `src/services/kredikaService.js` lines 173-200
- **Partner ID Config**: `.env` line with `KREDIKA_PARTNER_ID`
- **Environment Setup**: `.env` file for all Kredika credentials

---

## Testing Checklist

- [ ] Order creation with Kredika payment method
- [ ] All 7 payload fields populated correctly
- [ ] Partner ID matches Kredika system
- [ ] External references are unique and consistent
- [ ] Amount conversions to cents are accurate
- [ ] Active credits calculation includes only Kredika orders
- [ ] Notes field contains useful order information
- [ ] Kredika response stored in order.payment.kredika
- [ ] Stock reduced only after successful Kredika reservation
- [ ] Webhook handling for reservation status updates

---

## Related Documentation

- [Kredika Philosophy](./KREDIKA_PHILOSOPHY.md)
- [Kredika Integration Guide](./KREDIKA_INTEGRATION.md)
- [README Kredika](./README_KREDIKA.md)
- [API Integration Guide](./API_INTEGRATION_GUIDE.md)

---

**Last Updated**: January 15, 2024
**Version**: 1.0
**Status**: Production Ready ✓
