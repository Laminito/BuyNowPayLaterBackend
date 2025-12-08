const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const creditController = require('../controllers/creditController');
const { protect } = require('../middleware/auth');

/**
 * Toutes les routes de crédit sont protégées
 */
router.use(protect);

/**
 * === PROFIL ET COMMANDES ===
 */

/**
 * GET /api/v1/credit/profile
 * Récupérer le profil de crédit de l'utilisateur
 */
router.get('/profile', creditController.getCreditProfile);

/**
 * GET /api/v1/credit/orders
 * Récupérer les commandes Kredika avec pagination
 * Query params: status (RESERVED|ACTIVE|COMPLETED|CANCELLED), page, limit
 */
router.get('/orders', creditController.getUserKredikaOrders);

/**
 * GET /api/v1/credit/orders/:orderId/installments
 * Récupérer les détails des échéances
 */
router.get('/orders/:orderId/installments', creditController.getOrderInstallments);

/**
 * === DEMANDES DE CRÉDIT ===
 */

/**
 * POST /api/v1/credit/check-eligibility
 * Vérifier l'éligibilité pour un crédit
 */
router.post(
  '/check-eligibility',
  [
    body('purchaseAmount')
      .isFloat({ min: 1000, max: 50000000 })
      .withMessage('Purchase amount must be between 1000 and 50 000 000 XOF')
  ],
  creditController.checkCreditEligibility
);

/**
 * POST /api/v1/credit/apply
 * Soumettre une demande de crédit
 */
router.post(
  '/apply',
  [
    body('purchaseAmount')
      .isFloat({ min: 1000 })
      .withMessage('Purchase amount must be at least 1000 XOF'),
    body('desiredDuration')
      .isIn([3, 6, 12, 24])
      .withMessage('Desired duration must be 3, 6, 12, or 24 months'),
    body('reason')
      .trim()
      .optional()
      .isLength({ min: 5, max: 500 })
      .withMessage('Reason must be between 5 and 500 characters')
  ],
  creditController.applyCreditRequest
);

/**
 * === PAIEMENTS ===
 */

/**
 * GET /api/v1/credit/payment-methods/:orderId
 * Récupérer les méthodes de paiement pour une commande
 */
router.get('/payment-methods/:orderId', creditController.getPaymentMethods);

/**
 * POST /api/v1/credit/payment-confirmation
 * Confirmer un paiement d'échéance
 */
router.post(
  '/payment-confirmation',
  [
    body('orderId')
      .isMongoId()
      .withMessage('Invalid order ID'),
    body('installmentId')
      .trim()
      .notEmpty()
      .withMessage('Installment ID is required'),
    body('paymentMethod')
      .isIn(['WAVE', 'ORANGE_MONEY', 'BANK_TRANSFER', 'CASH'])
      .withMessage('Invalid payment method'),
    body('transactionReference')
      .trim()
      .notEmpty()
      .withMessage('Transaction reference is required'),
    body('amount')
      .isFloat({ min: 100 })
      .withMessage('Amount must be at least 100 XOF')
  ],
  creditController.confirmPayment
);

module.exports = router;
