const mongoose = require('mongoose');

const adminSettingsSchema = new mongoose.Schema({
  // Configuration générale
  siteName: {
    type: String,
    default: 'Furniture Store'
  },
  siteDescription: {
    type: String,
    default: 'Votre magasin de meubles en ligne'
  },
  contactEmail: {
    type: String,
    default: 'contact@furniture-store.com'
  },
  
  // Configuration des frais de livraison
  shipping: {
    freeShippingThreshold: {
      type: Number,
      default: 500 // Livraison gratuite au-dessus de 500€
    },
    standardShippingCost: {
      type: Number,
      default: 50
    },
    expressShippingCost: {
      type: Number,
      default: 85
    },
    internationalShippingCost: {
      type: Number,
      default: 120
    }
  },

  // Configuration des taxes
  taxes: {
    vatRate: {
      type: Number,
      default: 0.2 // 20% TVA
    },
    ecoTaxRate: {
      type: Number,
      default: 0.02 // 2% éco-taxe
    }
  },

  // Configuration Kredika et commissions
  kredika: {
    commissionRate: {
      type: Number,
      default: 0.029 // 2.9% commission par défaut
    },
    fixedCommission: {
      type: Number,
      default: 0.30 // 0.30€ fixe par transaction
    },
    minimumAmount: {
      type: Number,
      default: 1 // Montant minimum pour Kredika (1€)
    },
    maximumAmount: {
      type: Number,
      default: 3000 // Montant maximum pour Kredika (3000€)
    },
    installmentOptions: [{
      months: { type: Number, required: true },
      interestRate: { type: Number, required: true },
      minAmount: { type: Number, required: true },
      isActive: { type: Boolean, default: true }
    }],
    // Configuration des frais par durée
    feeStructure: {
      threeMonths: {
        rate: { type: Number, default: 0.0 },
        fixedFee: { type: Number, default: 15 }
      },
      sixMonths: {
        rate: { type: Number, default: 0.025 },
        fixedFee: { type: Number, default: 20 }
      },
      twelveMonths: {
        rate: { type: Number, default: 0.05 },
        fixedFee: { type: Number, default: 25 }
      },
      twentyFourMonths: {
        rate: { type: Number, default: 0.08 },
        fixedFee: { type: Number, default: 35 }
      }
    }
  },

  // Configuration des remises et promotions
  promotions: {
    maxDiscountPercentage: {
      type: Number,
      default: 70 // Maximum 70% de remise
    },
    loyaltyPointsRate: {
      type: Number,
      default: 0.01 // 1% en points de fidélité
    },
    referralBonus: {
      type: Number,
      default: 25 // 25€ bonus parrainage
    }
  },

  // Configuration des notifications
  notifications: {
    emailNotifications: {
      newOrder: { type: Boolean, default: true },
      paymentConfirmed: { type: Boolean, default: true },
      orderShipped: { type: Boolean, default: true },
      lowStock: { type: Boolean, default: true }
    },
    smsNotifications: {
      orderConfirmation: { type: Boolean, default: false },
      deliveryUpdate: { type: Boolean, default: false }
    },
    pushNotifications: {
      enabled: { type: Boolean, default: true },
      topics: [String]
    }
  },

  // Configuration du contenu
  content: {
    maintenanceMode: {
      enabled: { type: Boolean, default: false },
      message: { type: String, default: 'Site en maintenance' }
    },
    featuredProductsCount: {
      type: Number,
      default: 8
    },
    productsPerPage: {
      type: Number,
      default: 12
    },
    allowGuestCheckout: {
      type: Boolean,
      default: true
    }
  },

  // Configuration des médias
  media: {
    maxImageSize: {
      type: Number,
      default: 5242880 // 5MB
    },
    maxVideoSize: {
      type: Number,
      default: 52428800 // 50MB
    },
    allowedImageTypes: {
      type: [String],
      default: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    },
    allowedVideoTypes: {
      type: [String],
      default: ['video/mp4', 'video/webm', 'video/ogg']
    },
    imageCompressionQuality: {
      type: Number,
      default: 85
    }
  },

  // Paramètres modifiés par l'admin
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Middleware pour s'assurer qu'il n'y a qu'une seule instance
adminSettingsSchema.statics.getInstance = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = new this({
      kredika: {
        installmentOptions: [
          { months: 3, interestRate: 0.0, minAmount: 100, isActive: true },
          { months: 6, interestRate: 0.025, minAmount: 300, isActive: true },
          { months: 12, interestRate: 0.05, minAmount: 600, isActive: true },
          { months: 24, interestRate: 0.08, minAmount: 1200, isActive: true }
        ]
      }
    });
    await settings.save();
  }
  return settings;
};

module.exports = mongoose.model('AdminSettings', adminSettingsSchema);