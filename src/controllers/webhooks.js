const Order = require('../models/Order');
const kredikaService = require('../services/kredikaService');

const handleKredikaWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-signature'];
    const webhookData = kredikaService.processWebhook(req.body, signature);

    if (!webhookData.valid) {
      console.error('Invalid webhook signature or data:', webhookData.error);
      return res.status(400).json({ error: 'Invalid webhook' });
    }

    const { event, transactionId, orderId, status, amount } = webhookData;
    console.log(`Received Kredika webhook: ${event} for order ${orderId}`);

    // Trouver la commande
    const order = await Order.findById(orderId);
    if (!order) {
      console.error(`Order not found: ${orderId}`);
      return res.status(404).json({ error: 'Order not found' });
    }

    // Traiter selon le type d'événement
    switch (event) {
      case 'payment.succeeded':
        if (order.payment.status === 'paid') {
          console.log(`Payment already confirmed for order ${orderId}`);
          return res.status(200).json({ success: true, message: 'Already processed' });
        }
        
        order.payment.status = 'paid';
        order.payment.paidAt = new Date();
        order.status = 'confirmed';
        order.statusHistory.push({
          status: 'confirmed',
          note: `Payment confirmed via Kredika (${transactionId})`
        });
        console.log(`Payment confirmed for order ${orderId}`);
        break;

      case 'payment.failed':
        order.payment.status = 'failed';
        order.status = 'cancelled';
        order.statusHistory.push({
          status: 'cancelled',
          note: `Payment failed (${transactionId})`
        });
        
        // Restaurer le stock en cas d'échec
        for (const item of order.items) {
          await Product.findByIdAndUpdate(
            item.product,
            { $inc: { stockQuantity: item.quantity } }
          );
        }
        console.log(`Payment failed for order ${orderId}, stock restored`);
        break;

      case 'payment.refunded':
        order.payment.status = 'refunded';
        order.statusHistory.push({
          status: 'refunded',
          note: `Payment refunded (${transactionId})`
        });
        
        // Si la commande était confirmée, restaurer le stock
        if (order.status === 'confirmed' || order.status === 'processing') {
          for (const item of order.items) {
            await Product.findByIdAndUpdate(
              item.product,
              { $inc: { stockQuantity: item.quantity } }
            );
          }
          order.status = 'cancelled';
        }
        console.log(`Payment refunded for order ${orderId}`);
        break;

      case 'payment.pending':
        order.payment.status = 'pending';
        order.statusHistory.push({
          status: 'pending',
          note: `Payment pending (${transactionId})`
        });
        console.log(`Payment pending for order ${orderId}`);
        break;

      default:
        console.log(`Unhandled webhook event: ${event}`);
        return res.status(200).json({ success: true, message: 'Event not handled' });
    }

    await order.save();
    console.log(`Order ${orderId} updated successfully`);

    res.status(200).json({ success: true, message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

// Webhook de test pour vérifier la connectivité
const testWebhook = async (req, res) => {
  try {
    console.log('Test webhook received:', {
      headers: req.headers,
      body: req.body,
      timestamp: new Date().toISOString()
    });
    
    res.status(200).json({ 
      success: true, 
      message: 'Test webhook received successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Test webhook error:', error);
    res.status(500).json({ error: 'Test webhook failed' });
  }
};

module.exports = { 
  handleKredikaWebhook,
  testWebhook
};