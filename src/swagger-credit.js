/**
 * @swagger
 * tags:
 *   - name: Credit Management
 *     description: |
 *       # Kredika Credit Management - "Buy Now, Pay Later"
 *       
 *       Manage customer credit profiles, eligibility checks, and flexible payment plans
 *       through Kredika's interest-free credit solutions.
 *       
 *       **Kredika Philosophy**: Making aspirational purchases accessible through simple,
 *       transparent, and customer-friendly payment plans.
 *       
 *       **Core Features**:
 *       - No interest charges - Credit is completely free
 *       - Flexible durations - 3, 6, 12, or 24-month payment plans
 *       - Multiple payment methods - Wave, Orange Money, Bank transfers, Cash payments
 *       - Instant approval - Real-time eligibility decisions for qualified customers
 *       - Transparent pricing - Clear installment schedules with no hidden fees
 *       
 *       **Supported Payment Methods**:
 *       - 📱 **Wave**: Instant mobile money payment
 *       - 🟠 **Orange Money**: USSD and mobile payment
 *       - 🏦 **Bank Transfer**: Direct bank account payment
 *       - 💵 **Cash**: Physical payment at Furniture Market locations
 *       
 *       **Customer Journey**:
 *       1. Customer browsing furniture → finds desired product
 *       2. Customer checks eligibility → GET /credit/check-eligibility
 *       3. System displays payment options → 3, 6, 12, 24 months
 *       4. Customer creates order with Kredika → POST /orders (paymentMethod: "kredika")
 *       5. System creates Kredika reservation → Installments scheduled
 *       6. Customer receives payment instructions → SMS/Email with details
 *       7. Customer pays installments → Any of 4 payment methods
 *       8. Payment webhook → System updates order status
 *       9. Order delivered → Customer pays over time
 */

/**
 * @swagger
 * /v1/credit/profile:
 *   get:
 *     summary: Get user credit profile
 *     description: Retrieve detailed credit profile including limit, available credit, usage statistics
 *     tags:
 *       - Credit Management
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Credit profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 creditProfile:
 *                   type: object
 *                   properties:
 *                     creditLimit:
 *                       type: number
 *                       example: 1000000
 *                       description: Maximum credit amount in XOF
 *                     availableCredit:
 *                       type: number
 *                       example: 750000
 *                       description: Available credit amount in XOF
 *                     usedCredit:
 *                       type: number
 *                       example: 250000
 *                       description: Already used credit in XOF
 *                     outstandingAmount:
 *                       type: number
 *                       example: 150000
 *                       description: Total outstanding payments due
 *                     creditUtilization:
 *                       type: object
 *                       properties:
 *                         percentage:
 *                           type: number
 *                           example: 25
 *                         ratio:
 *                           type: string
 *                           example: "250000 / 1000000"
 *                     statistics:
 *                       type: object
 *                       properties:
 *                         totalKredikaOrders:
 *                           type: number
 *                           example: 5
 *                         activeOrders:
 *                           type: number
 *                           example: 2
 *                         completedOrders:
 *                           type: number
 *                           example: 3
 *                         defaultedOrders:
 *                           type: number
 *                           example: 0
 *       401:
 *         description: Unauthorized - token required
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /v1/credit/orders:
 *   get:
 *     summary: Get user's Kredika orders with pagination
 *     description: Retrieve all Kredika orders for the authenticated user with optional filtering
 *     tags:
 *       - Credit Management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [RESERVED, ACTIVE, COMPLETED, CANCELLED]
 *         description: Filter by Kredika reservation status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: number
 *                     limit:
 *                       type: number
 *                     total:
 *                       type: number
 *                     pages:
 *                       type: number
 *                 orders:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       orderNumber:
 *                         type: string
 *                         example: "ORD-1765190331460-19"
 *                       status:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       pricing:
 *                         type: object
 *                       kredika:
 *                         type: object
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /v1/credit/orders/{orderId}/installments:
 *   get:
 *     summary: Get installment details for an order
 *     description: Retrieve all installments/échéances for a specific Kredika order
 *     tags:
 *       - Credit Management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID (MongoDB ObjectId)
 *     responses:
 *       200:
 *         description: Installments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 order:
 *                   type: object
 *                   properties:
 *                     orderNumber:
 *                       type: string
 *                     status:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                 credit:
 *                   type: object
 *                   properties:
 *                     reservationId:
 *                       type: string
 *                     status:
 *                       type: string
 *                     monthlyPayment:
 *                       type: number
 *                       description: Monthly payment amount in XOF
 *                     installmentCount:
 *                       type: number
 *                     totalAmount:
 *                       type: number
 *                 installments:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       installmentId:
 *                         type: string
 *                       sequenceNumber:
 *                         type: number
 *                         example: 1
 *                       dueDate:
 *                         type: string
 *                         format: date
 *                       amount:
 *                         type: number
 *                       status:
 *                         type: string
 *                         enum: [PENDING, PAID, OVERDUE]
 *                       isOverdue:
 *                         type: boolean
 *                 statistics:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                     paid:
 *                       type: number
 *                     pending:
 *                       type: number
 *                     overdue:
 *                       type: number
 *                 nextInstallment:
 *                   type: object
 *                   nullable: true
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /v1/credit/check-eligibility:
 *   post:
 *     summary: Check credit eligibility for a purchase amount
 *     description: Verify if user is eligible for credit and get installment options
 *     tags:
 *       - Credit Management
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - purchaseAmount
 *             properties:
 *               purchaseAmount:
 *                 type: number
 *                 example: 250000
 *                 description: Amount to purchase in XOF (1000 - 50,000,000)
 *           examples:
 *             basic:
 *               summary: Check eligibility for 250,000 XOF
 *               value:
 *                 purchaseAmount: 250000
 *     responses:
 *       200:
 *         description: Eligibility checked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 eligibility:
 *                   type: object
 *                   properties:
 *                     eligible:
 *                       type: boolean
 *                     reasons:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: List of ineligibility reasons (empty if eligible)
 *                     purchaseAmount:
 *                       type: number
 *                     creditLimit:
 *                       type: number
 *                     availableCredit:
 *                       type: number
 *                     estimatedInstallments:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           duration:
 *                             type: number
 *                             enum: [3, 6, 12, 24]
 *                             description: Duration in months
 *                           monthlyPayment:
 *                             type: number
 *                           totalInstallments:
 *                             type: number
 *                           totalAmount:
 *                             type: number
 *                           interestAmount:
 *                             type: number
 *                           estimatedMonthlyRate:
 *                             type: number
 *                             description: Estimated interest rate percentage
 *       400:
 *         description: Bad request - invalid amount
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /v1/credit/apply:
 *   post:
 *     summary: Submit a credit application
 *     description: Apply for credit with desired duration and reason
 *     tags:
 *       - Credit Management
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - purchaseAmount
 *               - desiredDuration
 *             properties:
 *               purchaseAmount:
 *                 type: number
 *                 example: 250000
 *                 description: Amount to borrow in XOF
 *               desiredDuration:
 *                 type: integer
 *                 enum: [3, 6, 12, 24]
 *                 example: 6
 *                 description: Desired duration in months
 *               reason:
 *                 type: string
 *                 example: "Achat mobilier chambre"
 *                 description: Optional reason for credit (5-500 chars)
 *           examples:
 *             basic:
 *               summary: Apply for 250,000 XOF over 6 months
 *               value:
 *                 purchaseAmount: 250000
 *                 desiredDuration: 6
 *                 reason: "Achat mobilier pour chambre"
 *     responses:
 *       201:
 *         description: Credit application submitted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 creditRequest:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     purchaseAmount:
 *                       type: number
 *                     desiredDuration:
 *                       type: number
 *                     reason:
 *                       type: string
 *                     status:
 *                       type: string
 *                       enum: [PENDING, APPROVED, REJECTED]
 *                     submittedAt:
 *                       type: string
 *                       format: date-time
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *                     message:
 *                       type: string
 *       400:
 *         description: Bad request - invalid data or insufficient credit
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /v1/credit/payment-methods/{orderId}:
 *   get:
 *     summary: Get available payment methods for order
 *     description: Retrieve payment methods and instructions (Wave, Orange Money, Bank, Cash)
 *     tags:
 *       - Credit Management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Payment methods retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 orderId:
 *                   type: string
 *                 orderNumber:
 *                   type: string
 *                 paymentMethods:
 *                   type: object
 *                   properties:
 *                     wave:
 *                       type: object
 *                       description: Wave payment details
 *                     orangeMoney:
 *                       type: object
 *                       description: Orange Money payment details
 *                     bank:
 *                       type: object
 *                       description: Bank transfer details
 *                     cash:
 *                       type: object
 *                       description: Cash payment locations
 *                     availableMethods:
 *                       type: array
 *                       items:
 *                         type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /v1/credit/payment-confirmation:
 *   post:
 *     summary: Confirm installment payment
 *     description: Mark an installment as paid after confirming payment
 *     tags:
 *       - Credit Management
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - installmentId
 *               - paymentMethod
 *               - transactionReference
 *               - amount
 *             properties:
 *               orderId:
 *                 type: string
 *                 example: "6935d5498ce6b036f4aebd0d"
 *               installmentId:
 *                 type: string
 *                 example: "INST-001-2025"
 *               paymentMethod:
 *                 type: string
 *                 enum: [WAVE, ORANGE_MONEY, BANK_TRANSFER, CASH]
 *                 example: "WAVE"
 *               transactionReference:
 *                 type: string
 *                 example: "WAVE-TXN-2025-001"
 *                 description: Payment gateway transaction reference
 *               amount:
 *                 type: number
 *                 example: 50000
 *                 description: Payment amount in XOF
 *           examples:
 *             wave:
 *               summary: Payment via Wave
 *               value:
 *                 orderId: "6935d5498ce6b036f4aebd0d"
 *                 installmentId: "INST-001-2025"
 *                 paymentMethod: "WAVE"
 *                 transactionReference: "WAVE-TXN-2025-001"
 *                 amount: 50000
 *             orange:
 *               summary: Payment via Orange Money
 *               value:
 *                 orderId: "6935d5498ce6b036f4aebd0d"
 *                 installmentId: "INST-002-2025"
 *                 paymentMethod: "ORANGE_MONEY"
 *                 transactionReference: " ORANGE-TXN-2025-001"
 *                 amount: 50000
 *     responses:
 *       200:
 *         description: Payment confirmed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 installment:
 *                   type: object
 *                   properties:
 *                     installmentId:
 *                       type: string
 *                     amount:
 *                       type: number
 *                     status:
 *                       type: string
 *                       enum: [PAID, PENDING, OVERDUE]
 *                     paidAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Bad request or invalid installment
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order or installment not found
 *       500:
 *         description: Internal server error
 */
