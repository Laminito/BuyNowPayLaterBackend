const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  /**
   * Initialiser le transporteur SMTP
   */
  initializeTransporter() {
    try {
      if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
        this.transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT || 587,
          secure: process.env.SMTP_SECURE === 'true', // true pour 465, false pour other ports
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD
          }
        });
      } else {
        // Mode test - afficher les emails dans la console
        console.log('⚠️ Email service in test mode - no SMTP configured');
        this.testMode = true;
      }
    } catch (error) {
      console.error('Failed to initialize email service:', error.message);
      this.testMode = true;
    }
  }

  /**
   * Envoyer un email
   */
  async send(to, subject, htmlContent, textContent = null) {
    try {
      if (this.testMode) {
        console.log(`📧 [TEST MODE] Email to ${to}:`);
        console.log(`Subject: ${subject}`);
        console.log(`Content:\n${textContent || htmlContent}`);
        return { success: true, testMode: true };
      }

      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to,
        subject,
        html: htmlContent,
        text: textContent || htmlContent.replace(/<[^>]*>/g, '')
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email sent to ${to}: ${result.messageId}`);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error(`❌ Failed to send email to ${to}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Email de confirmation d'inscription
   */
  async sendWelcomeEmail(user) {
    const subject = 'Bienvenue sur Furniture Store!';
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #2c3e50; color: #fff; padding: 20px; border-radius: 5px; }
            .content { padding: 20px; }
            .button { 
              display: inline-block; 
              background-color: #3498db; 
              color: white; 
              padding: 10px 20px; 
              text-decoration: none; 
              border-radius: 5px;
              margin-top: 10px;
            }
            .footer { 
              background-color: #ecf0f1; 
              padding: 20px; 
              text-align: center; 
              font-size: 12px;
              border-radius: 5px;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Bienvenue, ${user.firstName}!</h1>
            </div>
            
            <div class="content">
              <p>Merci d'avoir créé un compte sur <strong>Furniture Store</strong>!</p>
              
              <p>Votre compte est maintenant actif et vous pouvez commencer à explorer nos collections de meubles de qualité.</p>
              
              <p><strong>Informations de votre compte:</strong></p>
              <ul>
                <li>Email: ${user.email}</li>
                <li>Nom: ${user.firstName} ${user.lastName}</li>
              </ul>
              
              <p>Pour commencer, explorez notre catalogue et ajoutez vos produits favoris!</p>
              
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" class="button">
                Accéder à votre compte
              </a>
            </div>
            
            <div class="footer">
              <p>&copy; 2024 Furniture Store. Tous droits réservés.</p>
              <p>Questions? Contactez-nous à contact@furniture-store.com</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.send(user.email, subject, htmlContent);
  }

  /**
   * Email de confirmation de commande
   */
  async sendOrderConfirmationEmail(order, user) {
    const itemsHtml = order.items.map(item => `
      <tr>
        <td>${item.name}</td>
        <td>${item.quantity}</td>
        <td>${item.price.toFixed(2)}€</td>
        <td>${(item.price * item.quantity).toFixed(2)}€</td>
      </tr>
    `).join('');

    const subject = `Commande confirmée - ${order.orderNumber}`;
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #27ae60; color: #fff; padding: 20px; border-radius: 5px; }
            .content { padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            table th, table td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
            table th { background-color: #ecf0f1; }
            .total { font-weight: bold; font-size: 18px; }
            .shipping-info { background-color: #ecf0f1; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { 
              background-color: #ecf0f1; 
              padding: 20px; 
              text-align: center; 
              font-size: 12px;
              border-radius: 5px;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Commande Confirmée</h1>
              <p>Numéro de commande: <strong>${order.orderNumber}</strong></p>
            </div>
            
            <div class="content">
              <p>Bonjour ${user.firstName},</p>
              
              <p>Votre commande a été confirmée avec succès! Vous recevrez un email de suivi une fois votre commande expédiée.</p>
              
              <h3>Détail de votre commande:</h3>
              <table>
                <thead>
                  <tr>
                    <th>Produit</th>
                    <th>Quantité</th>
                    <th>Prix unitaire</th>
                    <th>Sous-total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>
              
              <h3>Résumé du paiement:</h3>
              <p>Sous-total: <strong>${order.pricing.subtotal.toFixed(2)}€</strong></p>
              <p>Frais de livraison: <strong>${order.pricing.shipping.toFixed(2)}€</strong></p>
              <p>TVA: <strong>${order.pricing.tax.toFixed(2)}€</strong></p>
              <p class="total">Total: <strong>${order.pricing.total.toFixed(2)}€</strong></p>
              
              <div class="shipping-info">
                <h3>Adresse de livraison:</h3>
                <p>
                  ${order.shippingAddress.firstName} ${order.shippingAddress.lastName}<br>
                  ${order.shippingAddress.street}<br>
                  ${order.shippingAddress.postalCode} ${order.shippingAddress.city}<br>
                  ${order.shippingAddress.country}
                </p>
              </div>
              
              <p>Merci d'avoir choisi Furniture Store!</p>
            </div>
            
            <div class="footer">
              <p>&copy; 2024 Furniture Store. Tous droits réservés.</p>
              <p>Suivi de commande: <a href="${process.env.FRONTEND_URL}/orders/${order._id}">Voir votre commande</a></p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.send(user.email, subject, htmlContent);
  }

  /**
   * Email de statut de paiement Kredika
   */
  async sendPaymentStatusEmail(order, user, status) {
    let subject, statusText, statusColor;

    switch (status) {
      case 'paid':
        subject = 'Paiement confirmé';
        statusText = 'Votre paiement a été confirmé avec succès';
        statusColor = '#27ae60';
        break;
      case 'failed':
        subject = 'Paiement échoué';
        statusText = 'Votre paiement a échoué. Veuillez réessayer.';
        statusColor = '#e74c3c';
        break;
      case 'pending':
        subject = 'Paiement en attente';
        statusText = 'Votre paiement est en cours de traitement';
        statusColor = '#f39c12';
        break;
      default:
        return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: ${statusColor}; color: #fff; padding: 20px; border-radius: 5px; }
            .content { padding: 20px; }
            .footer { 
              background-color: #ecf0f1; 
              padding: 20px; 
              text-align: center; 
              font-size: 12px;
              border-radius: 5px;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${statusText}</h1>
            </div>
            
            <div class="content">
              <p>Bonjour ${user.firstName},</p>
              
              <p>Voici le statut de votre paiement:</p>
              
              <p>
                <strong>Numéro de commande:</strong> ${order.orderNumber}<br>
                <strong>Montant:</strong> ${order.pricing.total.toFixed(2)}€<br>
                <strong>Statut:</strong> <span style="color: ${statusColor}; font-weight: bold;">${statusText}</span><br>
                <strong>Date:</strong> ${new Date().toLocaleDateString('fr-FR')}
              </p>
              
              ${status === 'failed' ? `
                <p style="color: #e74c3c;">
                  <strong>Que faire?</strong><br>
                  Veuillez vérifier les détails de votre paiement et réessayer. 
                  Si le problème persiste, contactez notre support à contact@furniture-store.com
                </p>
              ` : ''}
              
              <p>Merci de votre confiance!</p>
            </div>
            
            <div class="footer">
              <p>&copy; 2024 Furniture Store. Tous droits réservés.</p>
              <p>Support: contact@furniture-store.com</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.send(user.email, subject, htmlContent);
  }

  /**
   * Email de suivi de livraison
   */
  async sendShippingNotificationEmail(order, user) {
    const subject = `Votre commande est expédiée - ${order.orderNumber}`;
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #3498db; color: #fff; padding: 20px; border-radius: 5px; }
            .content { padding: 20px; }
            .tracking-box { background-color: #ecf0f1; padding: 20px; border-radius: 5px; margin: 20px 0; }
            .footer { 
              background-color: #ecf0f1; 
              padding: 20px; 
              text-align: center; 
              font-size: 12px;
              border-radius: 5px;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Votre commande est expédiée!</h1>
            </div>
            
            <div class="content">
              <p>Bonjour ${user.firstName},</p>
              
              <p>Bonne nouvelle! Votre commande <strong>${order.orderNumber}</strong> a été expédiée.</p>
              
              <div class="tracking-box">
                <h3>Informations de suivi:</h3>
                <p>
                  <strong>Transporteur:</strong> ${order.tracking?.carrier || 'À définir'}<br>
                  <strong>Numéro de suivi:</strong> ${order.tracking?.trackingNumber || 'À venir'}<br>
                  <strong>Livraison estimée:</strong> ${order.tracking?.estimatedDelivery 
                    ? new Date(order.tracking.estimatedDelivery).toLocaleDateString('fr-FR') 
                    : 'À définir'}
                </p>
              </div>
              
              <p>Vous pouvez suivre votre colis en utilisant le numéro de suivi ci-dessus.</p>
              
              <p>Des questions? N'hésitez pas à nous contacter!</p>
            </div>
            
            <div class="footer">
              <p>&copy; 2024 Furniture Store. Tous droits réservés.</p>
              <p>Support: contact@furniture-store.com</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.send(user.email, subject, htmlContent);
  }

  /**
   * Email de réinitialisation de mot de passe
   */
  async sendPasswordResetEmail(user, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    const subject = 'Réinitialiser votre mot de passe Furniture Store';
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #2c3e50; color: #fff; padding: 20px; border-radius: 5px; }
            .content { padding: 20px; }
            .button { 
              display: inline-block; 
              background-color: #e74c3c; 
              color: white; 
              padding: 10px 20px; 
              text-decoration: none; 
              border-radius: 5px;
              margin-top: 10px;
            }
            .warning { 
              background-color: #ffe8e8; 
              padding: 15px; 
              border-left: 4px solid #e74c3c; 
              border-radius: 5px;
              margin-top: 20px;
            }
            .footer { 
              background-color: #ecf0f1; 
              padding: 20px; 
              text-align: center; 
              font-size: 12px;
              border-radius: 5px;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Réinitialiser votre mot de passe</h1>
            </div>
            
            <div class="content">
              <p>Bonjour ${user.firstName},</p>
              
              <p>Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte.</p>
              
              <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe:</p>
              
              <a href="${resetUrl}" class="button">Réinitialiser le mot de passe</a>
              
              <p><small>Ou copiez ce lien dans votre navigateur: ${resetUrl}</small></p>
              
              <div class="warning">
                <strong>⚠️ Attention:</strong> Ce lien expirera dans 24 heures. 
                Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet email.
              </div>
            </div>
            
            <div class="footer">
              <p>&copy; 2024 Furniture Store. Tous droits réservés.</p>
              <p>Support: contact@furniture-store.com</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.send(user.email, subject, htmlContent);
  }

  /**
   * Email de newsletter
   */
  async sendNewsletterEmail(recipient, content) {
    const subject = content.subject || 'Newsletter Furniture Store';
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #2c3e50; color: #fff; padding: 20px; border-radius: 5px; }
            .content { padding: 20px; }
            .footer { 
              background-color: #ecf0f1; 
              padding: 20px; 
              text-align: center; 
              font-size: 12px;
              border-radius: 5px;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Furniture Store Newsletter</h1>
            </div>
            
            <div class="content">
              ${content.html}
            </div>
            
            <div class="footer">
              <p>&copy; 2024 Furniture Store. Tous droits réservés.</p>
              <p>
                <a href="${process.env.FRONTEND_URL}/unsubscribe?email=${recipient}">Se désabonner</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.send(recipient, subject, htmlContent);
  }

  /**
   * Email de contact/support
   */
  async sendContactEmail(contactData) {
    const subject = `Nouveau message de contact - ${contactData.subject}`;
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #2c3e50; color: #fff; padding: 20px; border-radius: 5px; }
            .content { padding: 20px; }
            .message { background-color: #ecf0f1; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { 
              background-color: #ecf0f1; 
              padding: 20px; 
              text-align: center; 
              font-size: 12px;
              border-radius: 5px;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Nouveau message de contact</h1>
            </div>
            
            <div class="content">
              <p><strong>De:</strong> ${contactData.name}</p>
              <p><strong>Email:</strong> ${contactData.email}</p>
              <p><strong>Téléphone:</strong> ${contactData.phone || 'Non fourni'}</p>
              <p><strong>Sujet:</strong> ${contactData.subject}</p>
              
              <div class="message">
                <h3>Message:</h3>
                <p>${contactData.message.replace(/\n/g, '<br>')}</p>
              </div>
            </div>
            
            <div class="footer">
              <p>Message automatique - Veuillez répondre à ${contactData.email}</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.send(process.env.SMTP_USER, subject, htmlContent);
  }
}

module.exports = new EmailService();
