const mongoose = require('mongoose');

const InstallmentSchema = new mongoose.Schema({
  number: {
    type: Number,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: [0, 'Installment amount cannot be negative']
  },
  dueDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'overdue', 'failed'],
    default: 'pending'
  },
  paidAt: Date,
  paymentMethod: String,
  transactionId: String
});

const PaymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  merchantId: {
    type: String,
    required: [true, 'Merchant ID is required']
  },
  merchantName: {
    type: String,
    required: [true, 'Merchant name is required']
  },
  productId: {
    type: String,
    required: [true, 'Product ID is required']
  },
  productName: {
    type: String,
    required: [true, 'Product name is required']
  },
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Total amount cannot be negative']
  },
  downPayment: {
    type: Number,
    default: 0,
    min: [0, 'Down payment cannot be negative']
  },
  remainingAmount: {
    type: Number,
    required: true
  },
  installments: {
    type: Number,
    required: [true, 'Number of installments is required'],
    min: [1, 'At least 1 installment is required'],
    max: [12, 'Maximum 12 installments allowed']
  },
  installmentAmount: {
    type: Number,
    required: true
  },
  interestRate: {
    type: Number,
    default: 0,
    min: [0, 'Interest rate cannot be negative']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'active', 'completed', 'cancelled', 'defaulted'],
    default: 'pending'
  },
  paymentSchedule: [InstallmentSchema],
  approvedAt: Date,
  completedAt: Date,
  cancelledAt: Date,
  cancelReason: String,
  metadata: {
    type: Map,
    of: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for paid installments count
PaymentSchema.virtual('paidInstallments').get(function() {
  return this.paymentSchedule.filter(installment => installment.status === 'paid').length;
});

// Virtual for remaining installments count
PaymentSchema.virtual('remainingInstallments').get(function() {
  return this.paymentSchedule.filter(installment => installment.status === 'pending').length;
});

// Virtual for overdue installments
PaymentSchema.virtual('overdueInstallments').get(function() {
  return this.paymentSchedule.filter(installment => {
    return installment.status === 'pending' && installment.dueDate < new Date();
  });
});

// Virtual for next payment due date
PaymentSchema.virtual('nextPaymentDate').get(function() {
  const nextInstallment = this.paymentSchedule.find(installment => installment.status === 'pending');
  return nextInstallment ? nextInstallment.dueDate : null;
});

// Calculate remaining amount after down payment
PaymentSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('totalAmount') || this.isModified('downPayment')) {
    this.remainingAmount = this.totalAmount - this.downPayment;
  }
  next();
});

// Calculate installment amount
PaymentSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('remainingAmount') || this.isModified('installments') || this.isModified('interestRate')) {
    const principal = this.remainingAmount;
    const rate = this.interestRate / 100;
    
    if (rate === 0) {
      // No interest
      this.installmentAmount = Math.round((principal / this.installments) * 100) / 100;
    } else {
      // With interest (simple interest for now)
      const totalWithInterest = principal * (1 + (rate * this.installments / 12));
      this.installmentAmount = Math.round((totalWithInterest / this.installments) * 100) / 100;
    }
  }
  next();
});

// Generate payment schedule
PaymentSchema.pre('save', function(next) {
  if (this.isNew && this.paymentSchedule.length === 0) {
    const startDate = new Date();
    
    for (let i = 1; i <= this.installments; i++) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + i);
      
      this.paymentSchedule.push({
        number: i,
        amount: this.installmentAmount,
        dueDate: dueDate,
        status: 'pending'
      });
    }
  }
  next();
});

// Update payment status based on installments
PaymentSchema.pre('save', function(next) {
  if (this.isModified('paymentSchedule')) {
    const allPaid = this.paymentSchedule.every(installment => installment.status === 'paid');
    const hasOverdue = this.paymentSchedule.some(installment => {
      return installment.status === 'pending' && installment.dueDate < new Date();
    });
    
    if (allPaid && this.status === 'active') {
      this.status = 'completed';
      this.completedAt = new Date();
    } else if (hasOverdue && this.status === 'active') {
      // Update overdue installments
      this.paymentSchedule.forEach(installment => {
        if (installment.status === 'pending' && installment.dueDate < new Date()) {
          installment.status = 'overdue';
        }
      });
    }
  }
  next();
});

// Method to process installment payment
PaymentSchema.methods.processInstallmentPayment = function(installmentNumber, paymentMethod, transactionId) {
  const installment = this.paymentSchedule.find(inst => inst.number === installmentNumber);
  
  if (!installment) {
    throw new Error('Installment not found');
  }
  
  if (installment.status === 'paid') {
    throw new Error('Installment already paid');
  }
  
  installment.status = 'paid';
  installment.paidAt = new Date();
  installment.paymentMethod = paymentMethod;
  installment.transactionId = transactionId;
  
  return installment;
};

// Method to get payment summary
PaymentSchema.methods.getPaymentSummary = function() {
  return {
    totalAmount: this.totalAmount,
    paidAmount: this.paymentSchedule
      .filter(inst => inst.status === 'paid')
      .reduce((sum, inst) => sum + inst.amount, 0),
    remainingAmount: this.paymentSchedule
      .filter(inst => inst.status !== 'paid')
      .reduce((sum, inst) => sum + inst.amount, 0),
    paidInstallments: this.paidInstallments,
    remainingInstallments: this.remainingInstallments,
    nextPaymentDate: this.nextPaymentDate,
    isOverdue: this.overdueInstallments.length > 0
  };
};

module.exports = mongoose.model('Payment', PaymentSchema);