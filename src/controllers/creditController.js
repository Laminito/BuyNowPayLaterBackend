const User = require('../models/User');
const Order = require('../models/Order');
const kredikaService = require('../services/kredikaService');
const { validationResult } = require('express-validator');

/**
 * ==========================================
 * KREDIKA PHILOSOPHY
 * ==========================================
 * 
 * "Acheter maintenant, payer plus tard"
 * 
 * Kredika democratizes access to quality furniture and products
 * by enabling flexible, interest-free credit solutions.
 * 
 * Our mission: Make aspirational purchases accessible to all,
 * through simple, transparent, and customer-friendly payment plans.
 * 
 * Core Values:
 * ✓ Accessibility - No interest, no hidden fees
 * ✓ Flexibility - Multiple payment methods (Wave, Orange Money, Bank, Cash)
 * ✓ Transparency - Clear installment schedules
 * ✓ Speed - Instant approval for eligible customers
 * ✓ Inclusivity - Serves underbanked populations in West Africa
 * 
 * ==========================================
 */

/**
 * Contrôleur de Gestion du Crédit Kredika
 * 
 * Gère les profils de crédit, les demandes, les limites et les paiements
 * selon la philosophie Kredika: "Buy Now, Pay Later"
 */

/**
 * GET /api/v1/credit/user/profile
 * Récupérer le profil de crédit de l'utilisateur connecté
 */
const getCreditProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select(
      'creditLimit availableCredit favorites'
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Récupérer les commandes Kredika de l'utilisateur
    const kredikaOrders = await Order.find({
      user: userId,
      'payment.method': 'kredika'
    }).select('_id orderNumber pricing payment status createdAt');

    // Calculer les statistiques de crédit
    const totalCreditUsed = kredikaOrders.reduce((sum, order) => {
      return sum + (order.pricing?.total || 0);
    }, 0);

    const activeKredikaOrders = kredikaOrders.filter(
      order => order.payment?.kredika?.status && 
               ['RESERVED', 'ACTIVE'].includes(order.payment.kredika.status)
    );

    const totalOutstanding = activeKredikaOrders.reduce((sum, order) => {
      const monthlyPayment = order.payment?.kredika?.monthlyPayment || 0;
      const remainingInstallments = order.payment?.kredika?.installments?.filter(
        inst => inst.status !== 'PAID'
      ).length || 0;
      return sum + (monthlyPayment * remainingInstallments);
    }, 0);

    res.status(200).json({
      success: true,
      creditProfile: {
        creditLimit: user.creditLimit,
        availableCredit: user.availableCredit,
        usedCredit: totalCreditUsed,
        outstandingAmount: totalOutstanding,
        creditUtilization: {
          percentage: Math.round((totalCreditUsed / user.creditLimit) * 100),
          ratio: `${totalCreditUsed} / ${user.creditLimit}`
        },
        statistics: {
          totalKredikaOrders: kredikaOrders.length,
          activeOrders: activeKredikaOrders.length,
          completedOrders: kredikaOrders.filter(
            o => o.payment?.kredika?.status === 'COMPLETED'
          ).length,
          defaultedOrders: kredikaOrders.filter(
            o => o.payment?.kredika?.status === 'DEFAULTED'
          ).length
        }
      }
    });
  } catch (error) {
    console.error('❌ Error fetching credit profile:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/v1/credit/user/orders
 * Récupérer toutes les commandes Kredika de l'utilisateur
 */
const getUserKredikaOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;

    let query = {
      user: userId,
      'payment.method': 'kredika'
    };

    // Filtre par statut si fourni
    if (status) {
      query['payment.kredika.status'] = status;
    }

    const skip = (page - 1) * limit;

    const orders = await Order.find(query)
      .select(
        '_id orderNumber pricing payment status createdAt updatedAt'
      )
      .populate('items.product', 'name price')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(query);

    const formattedOrders = orders.map(order => ({
      _id: order._id,
      orderNumber: order.orderNumber,
      status: order.status,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      pricing: order.pricing,
      kredika: {
        reservationId: order.payment?.kredika?.reservationId,
        status: order.payment?.kredika?.status,
        purchaseAmount: order.payment?.kredika?.purchaseAmount || order.pricing?.total,
        monthlyPayment: order.payment?.kredika?.monthlyPayment,
        installmentCount: order.payment?.kredika?.installmentCount,
        installments: (order.payment?.kredika?.installments || []).map(inst => ({
          installmentId: inst.installmentId,
          dueDate: inst.dueDate,
          amount: inst.amount,
          status: inst.status,
          paidAt: inst.paidAt
        }))
      },
      items: order.items
    }));

    res.status(200).json({
      success: true,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      orders: formattedOrders
    });
  } catch (error) {
    console.error('❌ Error fetching user Kredika orders:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/v1/credit/orders/:orderId/installments
 * Récupérer les détails des échéances d'une commande
 */
const getOrderInstallments = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    const order = await Order.findOne({
      _id: orderId,
      user: userId,
      'payment.method': 'kredika'
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const installments = order.payment?.kredika?.installments || [];
    const paymentMethods = order.payment?.kredika?.paymentInstructions || {};

    // Calculer les statistiques
    const stats = {
      total: installments.length,
      paid: installments.filter(i => i.status === 'PAID').length,
      pending: installments.filter(i => i.status === 'PENDING').length,
      overdue: installments.filter(i => i.status === 'OVERDUE').length
    };

    // Trouver la prochaine échéance
    const nextInstallment = installments.find(i => i.status === 'PENDING');

    res.status(200).json({
      success: true,
      order: {
        orderNumber: order.orderNumber,
        status: order.status,
        createdAt: order.createdAt
      },
      credit: {
        reservationId: order.payment?.kredika?.reservationId,
        status: order.payment?.kredika?.status,
        monthlyPayment: order.payment?.kredika?.monthlyPayment,
        installmentCount: order.payment?.kredika?.installmentCount,
        totalAmount: order.pricing?.total
      },
      installments: installments.map(inst => ({
        installmentId: inst.installmentId,
        sequenceNumber: installments.indexOf(inst) + 1,
        dueDate: inst.dueDate,
        amount: inst.amount,
        status: inst.status,
        paidAt: inst.paidAt,
        isOverdue: inst.status === 'OVERDUE' || (inst.status === 'PENDING' && new Date(inst.dueDate) < new Date())
      })),
      statistics: stats,
      nextInstallment: nextInstallment ? {
        installmentId: nextInstallment.installmentId,
        sequenceNumber: installments.indexOf(nextInstallment) + 1,
        dueDate: nextInstallment.dueDate,
        amount: nextInstallment.amount
      } : null,
      paymentMethods
    });
  } catch (error) {
    console.error('❌ Error fetching installments:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * POST /api/v1/credit/check-eligibility
 * Vérifier l'éligibilité de l'utilisateur pour un crédit
 */
const checkCreditEligibility = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.id;
    const { purchaseAmount } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Vérifications d'éligibilité
    const eligibility = {
      eligible: true,
      reasons: [],
      purchaseAmount,
      creditLimit: user.creditLimit,
      availableCredit: user.availableCredit,
      estimatedInstallments: []
    };

    // Vérifier la limite de crédit
    if (purchaseAmount > user.creditLimit) {
      eligibility.eligible = false;
      eligibility.reasons.push(
        `Purchase amount (${purchaseAmount} XOF) exceeds credit limit (${user.creditLimit} XOF)`
      );
    }

    // Vérifier le crédit disponible
    if (purchaseAmount > user.availableCredit) {
      eligibility.eligible = false;
      eligibility.reasons.push(
        `Insufficient available credit. Available: ${user.availableCredit} XOF, Needed: ${purchaseAmount} XOF`
      );
    }

    // Si éligible, calculer les différentes options d'échéances
    if (eligibility.eligible) {
      // Proposer 3, 6, 12 et 24 mois (si applicable)
      const durations = [3, 6, 12, 24];
      const interestRate = 0.08; // 8% annuel estimé

      eligibility.estimatedInstallments = durations.map(months => {
        const monthlyRate = interestRate / 12;
        const n = months;
        const PV = purchaseAmount;
        
        // Formule de calcul des annuités: A = PV * [r(1+r)^n] / [(1+r)^n - 1]
        const numerator = monthlyRate * Math.pow(1 + monthlyRate, n);
        const denominator = Math.pow(1 + monthlyRate, n) - 1;
        const monthlyPayment = Math.round(PV * (numerator / denominator));
        const totalAmount = monthlyPayment * months;
        const interestAmount = totalAmount - purchaseAmount;

        return {
          duration: months,
          monthlyPayment,
          totalInstallments: months,
          totalAmount,
          interestAmount,
          estimatedMonthlyRate: Math.round((interestAmount / purchaseAmount) * 100 * 100) / 100
        };
      });
    }

    res.status(200).json({
      success: true,
      eligibility
    });
  } catch (error) {
    console.error('❌ Error checking credit eligibility:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * POST /api/v1/credit/apply
 * Soumettre une demande de crédit
 */
const applyCreditRequest = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.id;
    const { purchaseAmount, desiredDuration, reason } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Vérifier l'éligibilité basique
    if (purchaseAmount > user.creditLimit) {
      return res.status(400).json({
        message: `Purchase amount exceeds credit limit of ${user.creditLimit} XOF`
      });
    }

    if (purchaseAmount > user.availableCredit) {
      return res.status(400).json({
        message: `Insufficient available credit. Available: ${user.availableCredit} XOF`
      });
    }

    // Créer la demande de crédit
    const creditRequest = {
      userId,
      purchaseAmount,
      desiredDuration,
      reason,
      status: 'PENDING',
      submittedAt: new Date(),
      reviewedAt: null,
      approvedAt: null,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Expire dans 7 jours
    };

    // Sauvegarder dans user.creditRequests (si le champ existe)
    if (!user.creditRequests) {
      user.creditRequests = [];
    }
    user.creditRequests.push(creditRequest);
    await user.save();

    console.log('📋 Credit application created:', {
      userId,
      purchaseAmount,
      desiredDuration
    });

    res.status(201).json({
      success: true,
      creditRequest: {
        _id: creditRequest._id || user._id,
        purchaseAmount: creditRequest.purchaseAmount,
        desiredDuration: creditRequest.desiredDuration,
        reason: creditRequest.reason,
        status: creditRequest.status,
        submittedAt: creditRequest.submittedAt,
        expiresAt: creditRequest.expiresAt,
        message: 'Credit application submitted. You will receive a decision within 24 hours.'
      }
    });
  } catch (error) {
    console.error('❌ Error applying for credit:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/v1/credit/payment-methods/:orderId
 * Récupérer les méthodes de paiement disponibles pour une commande
 */
const getPaymentMethods = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    const order = await Order.findOne({
      _id: orderId,
      user: userId,
      'payment.method': 'kredika'
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const paymentMethods = order.payment?.kredika?.paymentInstructions || {};

    res.status(200).json({
      success: true,
      orderId,
      orderNumber: order.orderNumber,
      paymentMethods: {
        wave: paymentMethods.wave || {},
        orangeMoney: paymentMethods.orangeMoney || {},
        bank: paymentMethods.bank || {},
        cash: paymentMethods.cash || {},
        availableMethods: Object.keys(paymentMethods).filter(
          key => paymentMethods[key] && Object.keys(paymentMethods[key]).length > 0
        )
      }
    });
  } catch (error) {
    console.error('❌ Error fetching payment methods:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * POST /api/v1/credit/payment-confirmation
 * Confirmer un paiement d'échéance
 */
const confirmPayment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { orderId, installmentId, paymentMethod, transactionReference, amount } = req.body;
    const userId = req.user.id;

    const order = await Order.findOne({
      _id: orderId,
      user: userId,
      'payment.method': 'kredika'
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Trouver l'échéance
    const installment = order.payment?.kredika?.installments?.find(
      i => i.installmentId === installmentId
    );

    if (!installment) {
      return res.status(404).json({ message: 'Installment not found' });
    }

    if (installment.status === 'PAID') {
      return res.status(400).json({ message: 'Installment already paid' });
    }

    // Enregistrer le paiement
    installment.status = 'PAID';
    installment.paidAt = new Date();

    await order.save();

    console.log('✅ Payment confirmed:', {
      orderId,
      installmentId,
      amount,
      method: paymentMethod,
      reference: transactionReference
    });

    res.status(200).json({
      success: true,
      message: 'Payment confirmed successfully',
      installment: {
        installmentId: installment.installmentId,
        amount: installment.amount,
        status: installment.status,
        paidAt: installment.paidAt
      }
    });
  } catch (error) {
    console.error('❌ Error confirming payment:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getCreditProfile,
  getUserKredikaOrders,
  getOrderInstallments,
  checkCreditEligibility,
  applyCreditRequest,
  getPaymentMethods,
  confirmPayment
};
