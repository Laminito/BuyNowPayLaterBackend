# Email Service Integration Guide

## Overview

This guide shows how to integrate the email service into different controllers to automatically send emails when certain actions occur.

## Quick Start

### 1. Import the Email Service

```javascript
const emailService = require('../services/emailService');
```

### 2. Send Email (with error handling)

```javascript
try {
  await emailService.sendWelcomeEmail(user);
} catch (error) {
  console.log('Email not sent:', error.message);
  // Continue anyway - don't block main operation
}
```

---

## Integration Examples

### Orders Controller

#### Send Email on Order Creation

**File**: `src/controllers/orders.js`

```javascript
const emailService = require('../services/emailService');

const createOrder = async (req, res, next) => {
  try {
    // ... validation and order creation ...
    
    const order = new Order({
      userId: req.user.id,
      items: req.body.items,
      totalAmount: calculateTotal(req.body.items),
      status: 'pending'
    });
    
    await order.save();
    
    // Send confirmation email
    try {
      const user = await User.findById(req.user.id);
      await order.populate('items.productId');
      await emailService.sendOrderConfirmationEmail(order, user);
    } catch (emailError) {
      console.log('⚠️ Order confirmation email not sent:', emailError.message);
    }
    
    res.status(201).json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};
```

---

### Payments Controller

#### Send Email on Payment Status Change

**File**: `src/controllers/payments.js`

```javascript
const emailService = require('../services/emailService');

const handleKredikaCallback = async (req, res, next) => {
  try {
    const { reservationId, status } = req.body;
    
    // Find order by Kredika reservation ID
    const order = await Order.findOne({
      'payment.kredika.reservationId': reservationId
    }).populate('userId');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    // Update order payment status
    order.payment.status = status;
    await order.save();
    
    // Send payment status email
    try {
      const statusMap = {
        'COMPLETED': 'confirmed',
        'FAILED': 'failed',
        'WAITING': 'pending'
      };
      
      const emailStatus = statusMap[status] || 'pending';
      
      await emailService.sendPaymentStatusEmail(
        order,
        order.userId,
        emailStatus
      );
    } catch (emailError) {
      console.log('⚠️ Payment status email not sent:', emailError.message);
    }
    
    res.json({
      success: true,
      message: 'Payment status updated'
    });
  } catch (error) {
    next(error);
  }
};
```

---

### Shipping Controller

#### Send Email on Shipment

**File**: `src/controllers/shipping.js`

```javascript
const emailService = require('../services/emailService');

const updateShipping = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { carrier, trackingNumber, estimatedDelivery } = req.body;
    
    const order = await Order.findByIdAndUpdate(
      orderId,
      {
        $set: {
          'tracking.carrier': carrier,
          'tracking.trackingNumber': trackingNumber,
          'tracking.estimatedDelivery': estimatedDelivery,
          'status': 'shipped'
        }
      },
      { new: true }
    ).populate('userId');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    // Send shipping notification email
    try {
      await emailService.sendShippingNotificationEmail(order, order.userId);
    } catch (emailError) {
      console.log('⚠️ Shipping notification email not sent:', emailError.message);
    }
    
    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};
```

---

### User Controller

#### Send Email on Account Actions

**File**: `src/controllers/users.js`

```javascript
const emailService = require('../services/emailService');

// Send verification email
const sendVerificationEmail = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const verificationToken = user.getVerificationToken();
    await user.save({ validateBeforeSave: false });
    
    try {
      await emailService.sendVerificationEmail(user, verificationToken);
      res.json({
        success: true,
        message: 'Verification email sent'
      });
    } catch (emailError) {
      user.verificationToken = undefined;
      user.verificationExpire = undefined;
      await user.save({ validateBeforeSave: false });
      
      res.status(500).json({
        success: false,
        error: 'Email could not be sent'
      });
    }
  } catch (error) {
    next(error);
  }
};

// Verify email
const verifyEmail = async (req, res, next) => {
  try {
    const crypto = require('crypto');
    const verificationToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');
    
    const user = await User.findOne({
      verificationToken,
      verificationExpire: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }
    
    user.emailVerified = true;
    user.verificationToken = undefined;
    user.verificationExpire = undefined;
    await user.save();
    
    res.json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    next(error);
  }
};
```

---

## Webhook Integration

### Kredika Webhook Handler

**File**: `src/webhooks/kredika-webhook.js`

```javascript
const emailService = require('../services/emailService');
const Order = require('../models/Order');

/**
 * Handle Kredika webhook events
 * POST /webhooks/kredika
 */
const handleKredikaWebhook = async (req, res, next) => {
  try {
    const { event, data } = req.body;
    
    console.log('📨 Kredika webhook received:', event);
    
    switch (event) {
      case 'reservation.confirmed':
        await handleReservationConfirmed(data);
        break;
      case 'reservation.failed':
        await handleReservationFailed(data);
        break;
      case 'payment.completed':
        await handlePaymentCompleted(data);
        break;
      default:
        console.log('Unknown event:', event);
    }
    
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

/**
 * Handle reservation confirmed
 */
async function handleReservationConfirmed(data) {
  try {
    const order = await Order.findOne({
      'payment.kredika.reservationId': data.reservationId
    }).populate('userId');
    
    if (!order) return;
    
    order.payment.status = 'confirmed';
    order.status = 'confirmed';
    await order.save();
    
    // Send email
    try {
      await emailService.sendPaymentStatusEmail(order, order.userId, 'confirmed');
    } catch (emailError) {
      console.log('⚠️ Email not sent:', emailError.message);
    }
  } catch (error) {
    console.error('Error handling reservation confirmed:', error);
  }
}

/**
 * Handle reservation failed
 */
async function handleReservationFailed(data) {
  try {
    const order = await Order.findOne({
      'payment.kredika.reservationId': data.reservationId
    }).populate('userId');
    
    if (!order) return;
    
    order.payment.status = 'failed';
    order.status = 'failed';
    await order.save();
    
    // Send email
    try {
      await emailService.sendPaymentStatusEmail(order, order.userId, 'failed');
    } catch (emailError) {
      console.log('⚠️ Email not sent:', emailError.message);
    }
  } catch (error) {
    console.error('Error handling reservation failed:', error);
  }
}

module.exports = { handleKredikaWebhook };
```

---

## Error Handling Best Practices

### Pattern 1: Silent Failure (Recommended for non-critical emails)

```javascript
// Email failure doesn't block main operation
try {
  await emailService.sendOrderConfirmationEmail(order, user);
} catch (emailError) {
  console.log('⚠️ Email not sent:', emailError.message);
  // Continue - order is still created
}
```

### Pattern 2: Explicit Failure (For critical operations)

```javascript
// Email must succeed
try {
  await emailService.sendPasswordResetEmail(user, resetToken);
  res.json({ success: true, message: 'Email sent' });
} catch (emailError) {
  // Clear token and return error
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save({ validateBeforeSave: false });
  
  return res.status(500).json({
    success: false,
    error: 'Email could not be sent'
  });
}
```

### Pattern 3: Async/Queue (For performance)

```javascript
// Send email asynchronously without waiting
const sendEmailAsync = async (emailFn) => {
  try {
    await emailFn();
  } catch (error) {
    console.log('⚠️ Async email error:', error.message);
  }
};

// Usage
sendEmailAsync(() => emailService.sendOrderConfirmationEmail(order, user));

// Immediately respond without waiting
res.json({ success: true, data: order });
```

---

## Testing Your Integration

### 1. Test with Postman

```
POST http://localhost:3000/api/v1/orders
Headers:
  Content-Type: application/json
  Authorization: Bearer <token>

Body:
{
  "items": [
    {
      "productId": "5f5d3e2c1a0b2c3d4e5f6g",
      "quantity": 2,
      "price": 5000
    }
  ]
}
```

### 2. Watch Console Logs

```
✅ Email service ready and verified
✉️ Email sent: <messageId>
```

### 3. Check Email

- Check recipient inbox
- Check spam folder
- Check email headers for authentication

---

## Monitoring & Logging

### Console Logging

```javascript
// Success logs
✉️ Email sent: <messageId>

// Warning logs
⚠️ Email service in test mode
⚠️ Email not sent: <error>

// Error logs
❌ Email service error: <error>
❌ Error sending email: <error>
```

### Database Logging (Optional)

```javascript
// Add email log to database
const EmailLog = require('../models/EmailLog');

try {
  await emailService.sendOrderConfirmationEmail(order, user);
  await EmailLog.create({
    recipient: user.email,
    subject: 'Order Confirmation',
    status: 'sent'
  });
} catch (error) {
  await EmailLog.create({
    recipient: user.email,
    subject: 'Order Confirmation',
    status: 'failed',
    error: error.message
  });
}
```

---

## Performance Considerations

### 1. Non-Blocking Emails

```javascript
// Fire and forget
setImmediate(async () => {
  try {
    await emailService.sendOrderConfirmationEmail(order, user);
  } catch (error) {
    console.log('Email error:', error.message);
  }
});

// Respond immediately
res.json({ success: true, data: order });
```

### 2. Queue System (Advanced)

```javascript
// Using Bull queue
const emailQueue = new Queue('emails', process.env.REDIS_URL);

// Add to queue
await emailQueue.add({
  type: 'orderConfirmation',
  orderId: order._id,
  userId: user._id
});

// Process queue
emailQueue.process(async (job) => {
  const { type, orderId, userId } = job.data;
  const order = await Order.findById(orderId);
  const user = await User.findById(userId);
  
  await emailService.sendOrderConfirmationEmail(order, user);
});

// Respond immediately
res.json({ success: true, data: order });
```

---

## Troubleshooting

### Issue: Email not sending

**Checklist:**
1. ✅ Is SMTP_EMAIL and SMTP_PASSWORD set in .env?
2. ✅ Is "✅ Email service ready and verified" in console?
3. ✅ Is user email valid?
4. ✅ Check console for error messages
5. ✅ Check spam folder

### Issue: Timeout

**Solution:**
```javascript
// Add timeout
const sendWithTimeout = async (emailFn, timeout = 5000) => {
  return Promise.race([
    emailFn(),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Email timeout')), timeout)
    )
  ]);
};
```

### Issue: HTML not rendering

**Solution:**
```javascript
// Ensure user email supports HTML
// Check if email client is HTML-capable
// Include plain text fallback
await emailService.sendEmail(to, subject, html, plainText);
```

---

## Summary

✅ **How to integrate email service:**

1. Import: `const emailService = require('../services/emailService');`
2. Call: `await emailService.sendEmailType(user, data);`
3. Handle: Try/catch with appropriate error handling
4. Test: Monitor console logs and check email inbox

✅ **When to send emails:**

- User registration → `sendWelcomeEmail()`
- Password reset → `sendPasswordResetEmail()`
- Order created → `sendOrderConfirmationEmail()`
- Payment status → `sendPaymentStatusEmail()`
- Shipment → `sendShippingNotificationEmail()`
- Email verify → `sendVerificationEmail()`

✅ **Error handling:**

- Non-critical: Silent failure (log warning)
- Critical: Block operation and return error
- Async: Fire and forget (don't block main operation)

For more details, see `EMAIL_SERVICE_DOCUMENTATION.md`
