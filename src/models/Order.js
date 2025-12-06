const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true
    },
    name: String, // Sauvegarde du nom au moment de la commande
    image: String  // Sauvegarde de l'image principale
  }],
  shippingAddress: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, default: 'France' },
    phone: String
  },
  pricing: {
    subtotal: { type: Number, required: true },
    shipping: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true }
  },
  payment: {
    method: {
      type: String,
      enum: ['kredika', 'card', 'paypal'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending'
    },
    kredikaTransactionId: String,
    // IDs Kredika - Nouvelle intégration
    kredika: {
      reservationId: String,           // ID unique de la réservation Kredika
      externalOrderRef: String,        // Référence externe (ORD-xxx)
      externalCustomerRef: String,     // Référence client (CUST-xxx)
      status: {                        // Statut Kredika: RESERVED, ACTIVE, COMPLETED, CANCELLED
        type: String,
        enum: ['RESERVED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'DEFAULTED'],
        default: 'RESERVED'
      },
      monthlyPayment: Number,          // Montant mensuel
      installmentCount: Number,        // Nombre d'échéances
      installments: [{                 // Détails des échéances
        installmentId: String,
        dueDate: Date,
        amount: Number,
        status: {
          type: String,
          enum: ['PENDING', 'PAID', 'OVERDUE'],
          default: 'PENDING'
        },
        paidAt: Date
      }],
      paymentInstructions: {
        wave: { phone: String, code: String },
        orangeMoney: { phone: String, code: String },
        bank: { accountNumber: String, bankName: String },
        cash: { location: String }
      },
      createdAt: Date,                 // Date de création de la réservation
      lastWebhookEvent: String,        // Dernier événement webhook reçu
      lastWebhookAt: Date              // Date du dernier webhook
    },
    paidAt: Date
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  tracking: {
    carrier: String,
    trackingNumber: String,
    estimatedDelivery: Date
  },
  notes: String,
  statusHistory: [{
    status: String,
    updatedAt: { type: Date, default: Date.now },
    note: String
  }]
}, {
  timestamps: true
});

// Génération automatique du numéro de commande
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `ORD-${Date.now()}-${count + 1}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);