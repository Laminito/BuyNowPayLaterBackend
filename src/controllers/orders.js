const Order = require('../models/Order');
const Product = require('../models/Product');
const AdminSettings = require('../models/AdminSettings');
const kredikaService = require('../services/kredikaService');
const { validationResult } = require('express-validator');

const createOrder = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { items, shippingAddress, paymentMethod, installments = 1 } = req.body;
    const userId = req.user.id;

    // Validation des produits et calcul des prix
    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product || !product.inStock) {
        return res.status(400).json({ 
          message: `Product ${product?.name || 'unknown'} is not available` 
        });
      }

      if (product.stockQuantity < item.quantity) {
        return res.status(400).json({
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

    // Récupérer les paramètres admin pour le calcul des frais
    const settings = await AdminSettings.getInstance();
    
    // Calcul des frais de livraison
    const shipping = subtotal >= settings.shipping.freeShippingThreshold ? 
      0 : settings.shipping.standardShippingCost;
    
    // Calcul des taxes
    const tax = subtotal * settings.taxes.vatRate;
    const total = subtotal + shipping + tax;

    // Créer la commande
    const order = new Order({
      user: userId,
      items: validatedItems,
      shippingAddress,
      pricing: {
        subtotal,
        shipping,
        tax,
        total
      },
      payment: {
        method: paymentMethod,
        status: 'pending'
      }
    });

    await order.save();

    // Si paiement Kredika, initier la transaction
    if (paymentMethod === 'kredika') {
      try {
        // Générer les références externes
        const externalOrderRef = order.orderNumber;
        const externalCustomerRef = `CUST-${req.user._id}`;

        console.log('📝 Création d\'une réservation Kredika pour la commande:', externalOrderRef);

        // Récupérer firstName et lastName (ou les extraire de name)
        let firstName = req.user.firstName;
        let lastName = req.user.lastName;
        
        // Si firstName/lastName n'existent pas, extraire de name
        if (!firstName || !lastName) {
          const nameParts = (req.user.name || '').split(' ');
          firstName = nameParts[0] || 'Client';
          lastName = nameParts[1] || '';
        }

        // Créer la réservation Kredika
        const kredikaReservation = await kredikaService.createReservation({
          externalOrderRef,
          externalCustomerRef,
          purchaseAmount: Math.round(total * 100), // Montant en centimes
          installmentCount: installments,
          customerEmail: req.user.email,
          customerFirstName: firstName,
          customerLastName: lastName
        });

        console.log('✅ Réservation Kredika créée:', {
          reservationId: kredikaReservation.reservationId,
          status: kredikaReservation.status,
          monthlyPayment: kredikaReservation.monthlyPayment
        });

        // Enregistrer tous les détails Kredika
        order.payment.kredika = {
          reservationId: kredikaReservation.reservationId,
          externalOrderRef,
          externalCustomerRef,
          status: kredikaReservation.status,
          monthlyPayment: kredikaReservation.monthlyPayment,
          installmentCount: installments,
          installments: (kredikaReservation.installments || []).map(inst => ({
            installmentId: inst.installmentId || inst.id,
            dueDate: inst.dueDate,
            amount: inst.amount,
            status: inst.status || 'PENDING'
          })),
          paymentInstructions: kredikaReservation.paymentInstructions || {},
          createdAt: new Date(),
          lastWebhookEvent: 'reservation.created',
          lastWebhookAt: new Date()
        };

        // Garder aussi l'ancien champ pour compatibilité
        order.payment.kredikaTransactionId = kredikaReservation.reservationId;
        
        await order.save();

        // Réduire le stock des produits
        for (const item of validatedItems) {
          await Product.findByIdAndUpdate(
            item.product,
            { $inc: { stockQuantity: -item.quantity } }
          );
        }

        console.log('📦 Stock réduit pour tous les produits');

        return res.status(201).json({
          success: true,
          order: order.toObject(),
          kredika: {
            reservationId: kredikaReservation.reservationId,
            status: kredikaReservation.status,
            monthlyPayment: kredikaReservation.monthlyPayment,
            installmentCount: installments,
            installments: kredikaReservation.installments,
            paymentInstructions: kredikaReservation.paymentInstructions
          },
          message: 'Order created successfully. Please complete payment via Kredika.'
        });
      } catch (kredikaError) {
        console.error('❌ Kredika reservation error:', kredikaError);
        // Supprimer la commande si la réservation Kredika échoue
        await Order.findByIdAndDelete(order._id);
        return res.status(400).json({ 
          message: 'Kredika payment reservation failed',
          error: kredikaError.message 
        });
      }
    }

    // Pour les autres méthodes de paiement
    res.status(201).json({
      success: true,
      order,
      message: 'Order created successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUserOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    const filter = { user: req.user.id };
    if (status) {
      filter.status = status;
    }

    const orders = await Order.find(filter)
      .populate('items.product', 'name images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Order.countDocuments(filter);

    res.json({
      success: true,
      data: orders,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user.id
    })
    .populate('items.product', 'name images sku')
    .populate('user', 'firstName lastName email');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.status(500).json({ message: error.message });
  }
};

const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({ 
        message: 'Order cannot be cancelled in current status' 
      });
    }

    // Si le paiement a été effectué via Kredika, initier le remboursement
    if (order.payment.method === 'kredika' && order.payment.status === 'paid') {
      try {
        await kredikaService.refundPayment(order.payment.kredikaTransactionId);
        order.payment.status = 'refunded';
      } catch (refundError) {
        console.error('Refund error:', refundError);
        return res.status(500).json({ 
          message: 'Failed to process refund' 
        });
      }
    }

    // Restaurer le stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stockQuantity: item.quantity } }
      );
    }

    order.status = 'cancelled';
    order.statusHistory.push({
      status: 'cancelled',
      note: 'Cancelled by customer'
    });
    
    await order.save();

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: order
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getKredikaInstallments = async (req, res) => {
  try {
    const { amount } = req.query;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Valid amount is required' });
    }

    const installmentOptions = await kredikaService.getAvailableInstallments(Number(amount));
    
    res.json({
      success: true,
      data: installmentOptions
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { shippingAddress, paymentMethod, status } = req.body;

    const order = await Order.findOne({
      _id: id,
      user: req.user.id
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Only allow updates to pending or confirmed orders
    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({ 
        message: 'Order cannot be updated in current status' 
      });
    }

    // Update allowed fields
    if (shippingAddress) {
      order.shippingAddress = { ...order.shippingAddress, ...shippingAddress };
    }

    if (paymentMethod && paymentMethod !== order.payment.method) {
      if (!['kredika', 'card', 'paypal'].includes(paymentMethod)) {
        return res.status(400).json({ message: 'Invalid payment method' });
      }
      order.payment.method = paymentMethod;
      order.payment.status = 'pending';
    }

    // Add status change to history if status is updated
    if (status && status !== order.status && ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].includes(status)) {
      order.statusHistory.push({
        status: order.status,
        timestamp: new Date()
      });
      order.status = status;
    }

    await order.save();

    res.json({
      success: true,
      message: 'Order updated successfully',
      data: order
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findOne({
      _id: id,
      user: req.user.id
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Only allow deletion of pending orders
    if (order.status !== 'pending') {
      return res.status(400).json({ 
        message: 'Only pending orders can be deleted' 
      });
    }

    // Restore stock for all items
    for (const item of order.items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stockQuantity: item.quantity } }
      );
    }

    // Delete the order
    await Order.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.status(500).json({ message: error.message });
  }
};

// Récupérer les détails Kredika et synchroniser les statuts
const getOrderKredikaDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findOne({
      _id: id,
      user: req.user.id
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Si pas de paiement Kredika, retourner un message
    if (!order.payment.kredika || !order.payment.kredika.reservationId) {
      return res.status(400).json({ 
        message: 'This order was not paid with Kredika' 
      });
    }

    try {
      // Récupérer les détails actualisés de la réservation Kredika
      const kredikaDetails = await kredikaService.getReservationById(
        order.payment.kredika.reservationId
      );

      console.log('🔄 Synchronisation des statuts Kredika pour:', order.orderNumber);

      // Mettre à jour les détails locaux si nécessaire
      const wasUpdated = order.payment.kredika.status !== kredikaDetails.status;

      if (wasUpdated) {
        console.log(`📊 Statut passé de ${order.payment.kredika.status} à ${kredikaDetails.status}`);
        
        order.payment.kredika.status = kredikaDetails.status;
        order.payment.kredika.lastWebhookEvent = 'sync.manual';
        order.payment.kredika.lastWebhookAt = new Date();

        // Mettre à jour aussi les échéances
        if (kredikaDetails.installments) {
          order.payment.kredika.installments = kredikaDetails.installments.map(inst => ({
            installmentId: inst.installmentId || inst.id,
            dueDate: inst.dueDate,
            amount: inst.amount,
            status: inst.status || 'PENDING',
            paidAt: inst.paidAt
          }));
        }

        // Mettre à jour le statut de la commande en fonction du statut Kredika
        if (kredikaDetails.status === 'ACTIVE' && order.status === 'pending') {
          order.status = 'confirmed';
          order.payment.status = 'pending'; // En attente de paiements échelonnés
        } else if (kredikaDetails.status === 'COMPLETED') {
          order.payment.status = 'paid';
          order.payment.paidAt = new Date();
          if (order.status === 'confirmed') {
            order.status = 'processing';
          }
        }

        await order.save();
      }

      return res.json({
        success: true,
        order: order.toObject(),
        kredika: {
          reservationId: order.payment.kredika.reservationId,
          externalOrderRef: order.payment.kredika.externalOrderRef,
          status: order.payment.kredika.status,
          monthlyPayment: order.payment.kredika.monthlyPayment,
          installmentCount: order.payment.kredika.installmentCount,
          installments: order.payment.kredika.installments,
          paymentInstructions: order.payment.kredika.paymentInstructions,
          lastWebhookEvent: order.payment.kredika.lastWebhookEvent,
          lastWebhookAt: order.payment.kredika.lastWebhookAt
        },
        message: wasUpdated ? 'Order synchronized from Kredika' : 'No changes detected'
      });
    } catch (kredikaError) {
      console.error('❌ Erreur lors de la récupération Kredika:', kredikaError);
      
      // Retourner les données locales même si la sync échoue
      return res.json({
        success: true,
        order: order.toObject(),
        kredika: order.payment.kredika,
        syncError: kredikaError.message,
        message: 'Using cached Kredika data'
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createOrder,
  getUserOrders,
  getOrderById,
  cancelOrder,
  getKredikaInstallments,
  updateOrder,
  deleteOrder,
  getOrderKredikaDetails
};