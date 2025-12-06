/**
 * Exemple d'intégration Kredika dans le contrôleur des commandes
 * Ce fichier montre comment intégrer complètement Kredika dans votre système
 */

const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const AdminSettings = require('../models/AdminSettings');
const kredikaService = require('../services/kredikaService');
const { validationResult } = require('express-validator');

// ===== EXEMPLE 1: Créer une commande avec paiement Kredika =====

const createOrderWithKredika = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { items, shippingAddress, paymentMethod, installmentCount = 6 } = req.body;
    const userId = req.user.id;
    const user = await User.findById(userId);

    // Step 1: Valider les produits et calculer le total
    console.log('📦 Validating products...');
    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.productId}`
        });
      }

      if (!product.inStock || product.stockQuantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${product.stockQuantity}`
        });
      }

      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;

      validatedItems.push({
        product: product._id,
        quantity: item.quantity,
        price: product.price,
        name: product.name,
        image: product.images[0]?.url
      });
    }

    // Step 2: Calculer les frais et taxes
    console.log('💰 Calculating fees and taxes...');
    const settings = await AdminSettings.getInstance();
    const shipping = subtotal >= settings.shipping.freeShippingThreshold ? 
      0 : settings.shipping.standardShippingCost;
    const tax = subtotal * settings.taxes.vatRate;
    const total = subtotal + shipping + tax;

    // Step 3: Générer les références uniques
    console.log('🔑 Generating references...');
    const orderNumber = `ORD-${Date.now()}-${userId.substring(18)}`;
    const externalOrderRef = orderNumber;
    const externalCustomerRef = `CUST-${userId}`;

    // Step 4: Si paiement Kredika, créer la réservation
    let kredikaReservation = null;
    if (paymentMethod === 'kredika') {
      console.log('🏦 Creating Kredika credit reservation...');
      
      try {
        // Vérifier que le client a suffisamment de crédit disponible
        const creditLimit = user.creditLimit || 500000;
        const usedCredit = user.usedCredit || 0;
        const availableCredit = creditLimit - usedCredit;

        if (total > availableCredit) {
          return res.status(400).json({
            success: false,
            message: `Insufficient credit limit. Available: ${availableCredit}, Required: ${total}`
          });
        }

        // Créer la réservation chez Kredika
        kredikaReservation = await kredikaService.createReservation({
          externalOrderRef: externalOrderRef,
          externalCustomerRef: externalCustomerRef,
          purchaseAmount: total,
          installmentCount: installmentCount,
          notes: `Order ${orderNumber} - Furniture Store`
        });

        console.log(`✅ Kredika reservation created: ${kredikaReservation.creditReservationId}`);
      } catch (kredikaError) {
        console.error('❌ Kredika error:', kredikaError);
        return res.status(400).json({
          success: false,
          message: 'Failed to create Kredika reservation',
          details: kredikaError.response?.data?.message || kredikaError.message
        });
      }
    }

    // Step 5: Créer la commande dans la base de données
    console.log('📝 Creating order in database...');
    const order = new Order({
      orderNumber,
      user: userId,
      items: validatedItems,
      shippingAddress,
      pricing: {
        subtotal,
        shipping,
        tax,
        total
      },
      paymentMethod,
      orderStatus: 'pending'
    });

    // Si Kredika, ajouter les détails de la réservation
    if (kredikaReservation) {
      order.kredika = {
        reservationId: kredikaReservation.creditReservationId,
        externalOrderRef: externalOrderRef,
        status: kredikaReservation.status, // 'RESERVED'
        installmentCount: kredikaReservation.installmentCount,
        monthlyPayment: kredikaReservation.monthlyPayment,
        totalAmount: kredikaReservation.totalAmount,
        interestAmount: kredikaReservation.interestAmount || 0,
        installments: kredikaReservation.installments || []
      };
    }

    await order.save();
    console.log(`✅ Order created: ${order._id}`);

    // Step 6: Réduire le stock des produits
    console.log('📦 Updating product stock...');
    for (const item of validatedItems) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stockQuantity: -item.quantity } }
      );
    }

    // Step 7: Si Kredika, générer une instruction de paiement pour la première échéance
    let paymentInstruction = null;
    if (kredikaReservation && kredikaReservation.installments && kredikaReservation.installments.length > 0) {
      console.log('💳 Generating payment instructions...');
      
      try {
        const firstInstallment = kredikaReservation.installments[0];
        paymentInstruction = await kredikaService.generatePaymentInstruction({
          installmentId: firstInstallment.installmentId,
          amountDue: firstInstallment.amountDue,
          dueDate: firstInstallment.dueDate,
          instructionType: 'STANDARD',
          language: 'fr',
          channel: 'SMS',
          customFields: {
            customerPhone: user.phone,
            orderRef: externalOrderRef
          }
        });

        console.log(`✅ Payment instruction generated: ${paymentInstruction.paymentInstructionId}`);
      } catch (instrError) {
        console.error('⚠️  Warning: Failed to generate payment instruction:', instrError.message);
        // Continue without payment instruction - order is still valid
      }
    }

    // Step 8: Retourner la réponse
    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        order: {
          _id: order._id,
          orderNumber: order.orderNumber,
          status: order.orderStatus,
          total: order.pricing.total,
          createdAt: order.createdAt
        },
        kredika: kredikaReservation ? {
          reservationId: kredikaReservation.creditReservationId,
          status: kredikaReservation.status,
          installmentCount: kredikaReservation.installmentCount,
          monthlyPayment: kredikaReservation.monthlyPayment,
          paymentInstructionId: paymentInstruction?.paymentInstructionId
        } : null
      }
    });

  } catch (error) {
    console.error('❌ Error creating order:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating order',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ===== EXEMPLE 2: Récupérer les détails d'une commande avec statut Kredika =====

const getOrderDetailsWithKredika = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    const order = await Order.findOne({
      _id: orderId,
      user: userId
    }).populate('items.product', 'name price image');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Si c'est une commande Kredika, synchroniser le statut
    if (order.kredika?.reservationId) {
      console.log('🔄 Syncing Kredika status...');
      
      try {
        const latestReservation = await kredikaService.getReservationById(order.kredika.reservationId);
        
        // Mettre à jour le statut local s'il a changé
        if (latestReservation.status !== order.kredika.status) {
          order.kredika.status = latestReservation.status;
          
          // Mapper le statut Kredika au statut local
          const statusMap = {
            'RESERVED': 'pending',
            'ACTIVE': 'confirmed',
            'COMPLETED': 'delivered',
            'CANCELLED': 'cancelled',
            'DEFAULTED': 'cancelled'
          };
          
          order.orderStatus = statusMap[latestReservation.status] || order.orderStatus;
          await order.save();
        }

        // Mettre à jour les installments
        if (latestReservation.installments) {
          order.kredika.installments = latestReservation.installments;
        }
      } catch (syncError) {
        console.error('⚠️  Warning: Failed to sync Kredika status:', syncError.message);
        // Continue with cached data
      }
    }

    res.json({
      success: true,
      data: order
    });

  } catch (error) {
    console.error('❌ Error getting order:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving order',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ===== EXEMPLE 3: Traiter un paiement d'échéance =====

const processInstallmentPayment = async (req, res) => {
  try {
    const { orderId, installmentIndex } = req.params;
    const { paidAmount, paymentReference } = req.body;
    const userId = req.user.id;

    // Valider les données
    if (!paidAmount || paidAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment amount'
      });
    }

    // Récupérer la commande
    const order = await Order.findOne({
      _id: orderId,
      user: userId
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (!order.kredika) {
      return res.status(400).json({
        success: false,
        message: 'This order does not have Kredika payments'
      });
    }

    // Récupérer l'échéance
    const installment = order.kredika.installments[installmentIndex];
    if (!installment) {
      return res.status(404).json({
        success: false,
        message: 'Installment not found'
      });
    }

    // Traiter le paiement chez Kredika
    console.log(`💳 Processing payment for installment ${installment.installmentId}...`);
    
    try {
      const paymentResult = await kredikaService.processInstallmentPayment(
        installment.installmentId,
        paidAmount,
        paymentReference || `PAY-${Date.now()}`
      );

      // Mettre à jour le statut local
      order.kredika.installments[installmentIndex].status = paymentResult.status;
      order.kredika.installments[installmentIndex].amountPaid = paymentResult.amountPaid;
      
      // Vérifier si toutes les échéances sont payées
      const allPaid = order.kredika.installments.every(inst => inst.status === 'PAID');
      if (allPaid) {
        order.orderStatus = 'delivered';
        order.kredika.status = 'COMPLETED';
      }

      await order.save();

      res.json({
        success: true,
        message: 'Payment processed successfully',
        data: {
          installment: order.kredika.installments[installmentIndex],
          orderStatus: order.orderStatus
        }
      });

    } catch (kredikaError) {
      console.error('❌ Kredika payment error:', kredikaError);
      return res.status(400).json({
        success: false,
        message: 'Failed to process payment',
        details: kredikaError.response?.data?.message || kredikaError.message
      });
    }

  } catch (error) {
    console.error('❌ Error processing payment:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing payment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ===== EXEMPLE 4: Activer une réservation Kredika =====

const activateKredikaReservation = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    const order = await Order.findOne({
      _id: orderId,
      user: userId
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (!order.kredika) {
      return res.status(400).json({
        success: false,
        message: 'Order does not have Kredika reservation'
      });
    }

    console.log(`⚡ Activating Kredika reservation ${order.kredika.reservationId}...`);
    
    try {
      const result = await kredikaService.activateReservation(order.kredika.reservationId);

      order.kredika.status = result.status;
      order.orderStatus = 'confirmed';
      await order.save();

      res.json({
        success: true,
        message: 'Reservation activated successfully',
        data: {
          reservationId: result.creditReservationId,
          status: result.status
        }
      });

    } catch (kredikaError) {
      console.error('❌ Kredika error:', kredikaError);
      return res.status(400).json({
        success: false,
        message: 'Failed to activate reservation',
        details: kredikaError.response?.data?.message || kredikaError.message
      });
    }

  } catch (error) {
    console.error('❌ Error activating reservation:', error);
    res.status(500).json({
      success: false,
      message: 'Error activating reservation'
    });
  }
};

module.exports = {
  createOrderWithKredika,
  getOrderDetailsWithKredika,
  processInstallmentPayment,
  activateKredikaReservation
};
