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
      if (process.env.SMTP_HOST && process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD) {
        this.transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT || 587,
          secure: false, // Gmail SMTP uses 587 with secure=false
          auth: {
            user: process.env.SMTP_EMAIL,
            pass: process.env.SMTP_PASSWORD
          }
        });

        // Vérifier la connexion
        this.transporter.verify((error, success) => {
          if (error) {
            console.log('❌ Email service connection error:', error.message);
            this.testMode = true;
          } else {
            console.log('✅ Email service ready and verified');
          }
        });
      } else {
        // Mode test - afficher les emails dans la console
        console.log('⚠️ Email service in test mode - no SMTP configured');
        console.log('Missing:', {
          SMTP_HOST: !process.env.SMTP_HOST,
          SMTP_EMAIL: !process.env.SMTP_EMAIL,
          SMTP_PASSWORD: !process.env.SMTP_PASSWORD
        });
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
        from: process.env.EMAIL_FROM || process.env.SMTP_EMAIL,
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
   * Alias pour send() - compatible avec l'utilisation dans les contrôleurs
   */
  async sendEmail(to, subject, htmlContent, textContent = null) {
    return this.send(to, subject, htmlContent, textContent);
  }

  /**
   * Email de confirmation d'inscription
   */
  async sendWelcomeEmail(user) {
    const subject = 'Bienvenue sur Buy Now Pay Later!';
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4CAF50; color: #fff; padding: 20px; border-radius: 5px; }
            .content { padding: 20px; }
            .button { 
              display: inline-block; 
              background-color: #4CAF50; 
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
              <h1>Bienvenue, ${user.firstName || user.name}! 🎉</h1>
            </div>
            
            <div class="content">
              <p>Merci d'avoir créé un compte sur <strong>Buy Now Pay Later</strong>!</p>
              
              <p>Votre compte est maintenant actif et vous pouvez commencer à explorer nos produits et acheter avec flexibilité de paiement.</p>
              
              <p><strong>Informations de votre compte:</strong></p>
              <ul>
                <li>Email: ${user.email}</li>
                <li>Nom: ${user.firstName || user.name} ${user.lastName || ''}</li>
                <li>Rôle: ${user.role}</li>
              </ul>
              
              <p>Pour commencer, explorez notre catalogue et découvrez notre service de paiement flexible!</p>
              
              <a href="${process.env.FRONTEND_PORT_1 || 'http://localhost:5173'}/dashboard" class="button">
                Accéder à votre compte
              </a>
            </div>
            
            <div class="footer">
              <p>&copy; 2025 Buy Now Pay Later. Tous droits réservés.</p>
              <p>Ne répondez pas à cet email. Contactez le support directement depuis votre compte.</p>
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
        <td>${item.productId?.name || item.name}</td>
        <td>${item.quantity}</td>
        <td>${item.price.toFixed(2)} XOF</td>
        <td>${(item.price * item.quantity).toFixed(2)} XOF</td>
      </tr>
    `).join('');

    const subject = `Commande confirmée - #${order._id}`;
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #2196F3; color: #fff; padding: 20px; border-radius: 5px; }
            .content { padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            table th, table td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
            table th { background-color: #ecf0f1; }
            .total { font-weight: bold; font-size: 18px; }
            .payment-info { background-color: #ecf0f1; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .kredika-badge { background-color: #4CAF50; color: white; padding: 5px 10px; border-radius: 3px; font-size: 12px; }
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
              <h1>Commande Confirmée ✓</h1>
              <p>Numéro de commande: <strong>#${order._id}</strong></p>
            </div>
            
            <div class="content">
              <p>Bonjour ${user.firstName || user.name},</p>
              
              <p>Votre commande a été confirmée avec succès!</p>
              
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
              <p>Sous-total: <strong>${order.totalAmount.toFixed(2)} XOF</strong></p>
              ${order.discountAmount ? `<p>Remise: <strong>-${order.discountAmount.toFixed(2)} XOF</strong></p>` : ''}
              <p class="total">Total: <strong>${order.totalAmount.toFixed(2)} XOF</strong></p>
              
              <div class="payment-info">
                <h3>Mode de paiement:</h3>
                ${order.payment?.method === 'kredika' ? `
                  <p>
                    <span class="kredika-badge">KREDIKA</span>
                    <strong>Achat à crédit</strong>
                  </p>
                  <p>Référence Kredika: <strong>${order.payment.kredika?.reservationId || 'En attente'}</strong></p>
                  <p>Statut du paiement: <strong>${order.payment.status || 'En attente'}</strong></p>
                ` : `
                  <p><strong>Carte bancaire</strong></p>
                `}
              </div>
              
              <p>Vous recevrez un email de suivi une fois votre commande expédiée.</p>
            </div>
            
            <div class="footer">
              <p>&copy; 2025 Buy Now Pay Later. Tous droits réservés.</p>
              <p>Suivi de commande: <a href="${process.env.FRONTEND_PORT_1 || 'http://localhost:5173'}/orders/${order._id}">Voir votre commande</a></p>
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
    let subject, statusText, statusColor, statusIcon;

    switch (status) {
      case 'confirmed':
      case 'paid':
        subject = 'Paiement confirmé - Buy Now Pay Later';
        statusText = 'Votre paiement a été confirmé avec succès';
        statusColor = '#27ae60';
        statusIcon = '✓';
        break;
      case 'failed':
        subject = 'Paiement échoué - Action requise';
        statusText = 'Votre paiement a échoué';
        statusColor = '#e74c3c';
        statusIcon = '✗';
        break;
      case 'pending':
      case 'waiting':
        subject = 'Paiement en attente - Buy Now Pay Later';
        statusText = 'Votre paiement est en cours de traitement';
        statusColor = '#f39c12';
        statusIcon = '⏳';
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
            .header { background-color: ${statusColor}; color: #fff; padding: 20px; border-radius: 5px; text-align: center; }
            .content { padding: 20px; }
            .status-box { 
              background-color: #f5f5f5; 
              padding: 15px; 
              border-left: 4px solid ${statusColor}; 
              border-radius: 5px;
              margin: 20px 0;
            }
            .kredika-info { background-color: #ecf0f1; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .action-button {
              display: inline-block;
              background-color: ${statusColor};
              color: white;
              padding: 10px 20px;
              text-decoration: none;
              border-radius: 5px;
              margin: 15px 0;
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
              <h1>${statusIcon} ${statusText}</h1>
            </div>
            
            <div class="content">
              <p>Bonjour ${user.firstName || user.name},</p>
              
              <div class="status-box">
                <p><strong>Numéro de commande:</strong> #${order._id}</p>
                <p><strong>Montant:</strong> ${order.totalAmount.toFixed(2)} XOF</p>
                <p><strong>Date:</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
                <p><strong>Méthode de paiement:</strong> Kredika (Achat à crédit)</p>
              </div>
              
              ${order.payment?.kredika?.reservationId ? `
              <div class="kredika-info">
                <p><strong>Référence Kredika:</strong> ${order.payment.kredika.reservationId}</p>
                ${order.payment.kredika.authorizationCode ? `<p><strong>Code d'autorisation:</strong> ${order.payment.kredika.authorizationCode}</p>` : ''}
              </div>
              ` : ''}
              
              ${status === 'failed' ? `
              <p style="color: #e74c3c; background-color: #ffe8e8; padding: 15px; border-radius: 5px; border-left: 4px solid #e74c3c;">
                <strong>⚠️ Action requise:</strong><br>
                Votre paiement n'a pas pu être traité. Veuillez:<br>
                • Vérifier les détails de votre paiement<br>
                • Réessayer ou utiliser un autre mode de paiement<br>
                • Contacter notre support si le problème persiste
              </p>
              <a href="${process.env.FRONTEND_PORT_1 || 'http://localhost:5173'}/orders/${order._id}" class="action-button">
                Voir la commande
              </a>
              ` : `
              <p>Votre commande est confirmée. Vous recevrez un email de suivi une fois votre colis préparé.</p>
              <a href="${process.env.FRONTEND_PORT_1 || 'http://localhost:5173'}/orders/${order._id}" class="action-button">
                Suivi de commande
              </a>
              `}
            </div>
            
            <div class="footer">
              <p>&copy; 2025 Buy Now Pay Later. Tous droits réservés.</p>
              <p>Support: contactez-nous depuis votre compte</p>
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
    const subject = `Votre commande est expédiée - #${order._id}`;
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
            .tracking-box { background-color: #ecf0f1; padding: 15px; border-radius: 5px; margin: 20px 0; }
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
              <h1>Votre commande est expédiée! 📦</h1>
            </div>
            
            <div class="content">
              <p>Bonjour ${user.firstName || user.name},</p>
              
              <p>Bonne nouvelle! Votre commande <strong>#${order._id}</strong> a été expédiée.</p>
              
              <div class="tracking-box">
                <h3>Informations de suivi:</h3>
                ${order.tracking?.carrier ? `<p><strong>Transporteur:</strong> ${order.tracking.carrier}</p>` : ''}
                ${order.tracking?.trackingNumber ? `<p><strong>Numéro de suivi:</strong> ${order.tracking.trackingNumber}</p>` : ''}
                ${order.tracking?.estimatedDelivery ? `<p><strong>Livraison estimée:</strong> ${new Date(order.tracking.estimatedDelivery).toLocaleDateString('fr-FR')}</p>` : ''}
              </div>
              
              <p>Vous pouvez suivre votre colis avec le numéro de suivi ci-dessus.</p>
              
              <p>Des questions? Contactez-nous depuis votre compte.</p>
            </div>
            
            <div class="footer">
              <p>&copy; 2025 Buy Now Pay Later. Tous droits réservés.</p>
              <p><a href="${process.env.FRONTEND_PORT_1 || 'http://localhost:5173'}/orders/${order._id}">Suivi de votre commande</a></p>
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
    const resetUrl = `${process.env.FRONTEND_PORT_1 || 'http://localhost:5173'}/reset-password/${resetToken}`;
    const subject = 'Réinitialiser votre mot de passe Buy Now Pay Later';
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #FF9800; color: #fff; padding: 20px; border-radius: 5px; }
            .content { padding: 20px; }
            .button { 
              display: inline-block; 
              background-color: #FF9800; 
              color: white; 
              padding: 12px 24px; 
              text-decoration: none; 
              border-radius: 5px;
              margin: 20px 0;
              font-weight: bold;
            }
            .warning { 
              background-color: #fff3cd; 
              padding: 15px; 
              border-left: 4px solid #ffc107; 
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
            .link-box {
              background-color: #f5f5f5;
              padding: 15px;
              border: 1px solid #ddd;
              border-radius: 5px;
              margin: 20px 0;
              word-break: break-all;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Réinitialisation de mot de passe</h1>
            </div>
            
            <div class="content">
              <p>Bonjour ${user.firstName || user.name},</p>
              
              <p>Vous avez demandé une réinitialisation de mot de passe pour votre compte Buy Now Pay Later.</p>
              
              <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe:</p>
              
              <center>
                <a href="${resetUrl}" class="button">Réinitialiser le mot de passe</a>
              </center>
              
              <p><strong>Ou copiez ce lien dans votre navigateur:</strong></p>
              <div class="link-box">${resetUrl}</div>
              
              <div class="warning">
                <strong>⚠️ Important:</strong> 
                <ul>
                  <li>Ce lien expirera dans 10 minutes</li>
                  <li>Ne partagez ce lien avec personne</li>
                  <li>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email</li>
                </ul>
              </div>
              
              <p>Des questions? Contactez notre support directement depuis votre compte.</p>
            </div>
            
            <div class="footer">
              <p>&copy; 2025 Buy Now Pay Later. Tous droits réservés.</p>
              <p>Ne répondez pas à cet email.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.send(user.email, subject, htmlContent);
  }

  /**
   * Email de vérification d'email
   */
  async sendVerificationEmail(user, verificationToken) {
    const verifyUrl = `${process.env.FRONTEND_PORT_1 || 'http://localhost:5173'}/verify-email/${verificationToken}`;
    const subject = 'Vérifiez votre adresse email';
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #9C27B0; color: #fff; padding: 20px; border-radius: 5px; }
            .content { padding: 20px; }
            .button { 
              display: inline-block; 
              background-color: #9C27B0; 
              color: white; 
              padding: 12px 24px; 
              text-decoration: none; 
              border-radius: 5px;
              margin: 20px 0;
              font-weight: bold;
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
              <h1>Vérifiez votre adresse email</h1>
            </div>
            
            <div class="content">
              <p>Bonjour ${user.firstName || user.name},</p>
              
              <p>Bienvenue sur Buy Now Pay Later! Veuillez vérifier votre adresse email en cliquant sur le lien ci-dessous:</p>
              
              <center>
                <a href="${verifyUrl}" class="button">Vérifier mon email</a>
              </center>
              
              <p><small>Ou copiez ce lien: ${verifyUrl}</small></p>
            </div>
            
            <div class="footer">
              <p>&copy; 2025 Buy Now Pay Later. Tous droits réservés.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.send(user.email, subject, htmlContent);
  }
}

module.exports = new EmailService();
