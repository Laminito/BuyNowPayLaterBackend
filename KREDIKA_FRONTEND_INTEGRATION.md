# 🎨 Intégration Kredika - Guide Frontend

## Vue d'ensemble

Lorsqu'un client choisit de payer par crédit Kredika, le processus front-end doit:
1. **Afficher** les options de crédit Kredika au checkout
2. **Collecter** les données du client (installments count, etc.)
3. **Appeler** le backend pour créer la réservation Kredika
4. **Afficher** les détails de paiement retournés
5. **Rediriger** le client vers les instructions de paiement Kredika

---

## 1. Structure du Checkout - Sélection du Mode de Paiement

### Composant de Sélection

```jsx
// CheckoutPaymentMethod.jsx
import React, { useState } from 'react';
import './CheckoutPaymentMethod.css';

const CheckoutPaymentMethod = ({ onPaymentMethodChange, total }) => {
  const [selectedMethod, setSelectedMethod] = useState('card');

  const handleMethodChange = (method) => {
    setSelectedMethod(method);
    onPaymentMethodChange(method);
  };

  return (
    <div className="payment-method-section">
      <h2>💳 Mode de Paiement</h2>
      
      <div className="payment-options">
        
        {/* Option 1: Carte Bancaire */}
        <label className="payment-option">
          <input
            type="radio"
            name="paymentMethod"
            value="card"
            checked={selectedMethod === 'card'}
            onChange={(e) => handleMethodChange(e.target.value)}
          />
          <div className="option-content">
            <h3>💳 Carte Bancaire</h3>
            <p>Paiement immédiat par carte visa/mastercard</p>
          </div>
        </label>

        {/* Option 2: Kredika Credit */}
        <label className="payment-option kredika-option">
          <input
            type="radio"
            name="paymentMethod"
            value="kredika"
            checked={selectedMethod === 'kredika'}
            onChange={(e) => handleMethodChange(e.target.value)}
          />
          <div className="option-content">
            <h3>📊 Kredika - Paiement Flexible</h3>
            <p>Paiement en plusieurs fois sans frais</p>
            <span className="kredika-badge">Jusqu'à 12 mois</span>
          </div>
        </label>

      </div>

      {selectedMethod === 'kredika' && (
        <KredikaInstallmentOptions total={total} />
      )}
    </div>
  );
};

export default CheckoutPaymentMethod;
```

---

## 2. Options d'Installments Kredika

### Composant des Installments

```jsx
// KredikaInstallmentOptions.jsx
import React, { useState, useEffect } from 'react';
import './KredikaInstallmentOptions.css';

const KredikaInstallmentOptions = ({ total }) => {
  const [selectedInstallments, setSelectedInstallments] = useState(6);
  const [installmentDetails, setInstallmentDetails] = useState([]);

  // Options disponibles (configurable selon Kredika)
  const INSTALLMENT_OPTIONS = [
    { count: 1, label: 'Paiement unique' },
    { count: 2, label: '2 versements' },
    { count: 3, label: '3 versements' },
    { count: 4, label: '4 versements' },
    { count: 6, label: '6 versements (Recommandé)' },
    { count: 9, label: '9 versements' },
    { count: 12, label: '12 versements' }
  ];

  // Calculer les détails des versements localement
  useEffect(() => {
    const monthlyAmount = Math.round((total / selectedInstallments) * 100) / 100;
    const details = Array.from({ length: selectedInstallments }, (_, i) => ({
      installmentNumber: i + 1,
      amount: monthlyAmount,
      date: getInstallmentDate(i + 1)
    }));
    setInstallmentDetails(details);
  }, [selectedInstallments, total]);

  const getInstallmentDate = (monthOffset) => {
    const date = new Date();
    date.setMonth(date.getMonth() + monthOffset);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="kredika-installment-section">
      <h3>📅 Choisissez votre plan de paiement</h3>
      
      <div className="installment-options">
        {INSTALLMENT_OPTIONS.map((option) => (
          <button
            key={option.count}
            className={`installment-btn ${
              selectedInstallments === option.count ? 'active' : ''
            }`}
            onClick={() => setSelectedInstallments(option.count)}
          >
            <div className="option-label">{option.label}</div>
            <div className="option-amount">
              {Math.round((total / option.count) * 100) / 100}€ x {option.count}
            </div>
          </button>
        ))}
      </div>

      {/* Détail des versements */}
      <div className="installment-details">
        <h4>Détail des versements</h4>
        <div className="installment-list">
          {installmentDetails.slice(0, 3).map((inst, idx) => (
            <div key={idx} className="installment-item">
              <span>Versement {inst.installmentNumber}</span>
              <span>{inst.amount}€</span>
              <span className="date">{inst.date}</span>
            </div>
          ))}
          {installmentDetails.length > 3 && (
            <div className="installment-item collapsed">
              <span>... et {installmentDetails.length - 3} autres versements</span>
            </div>
          )}
        </div>
      </div>

      {/* Signal Kredika */}
      <div className="kredika-info">
        <img 
          src="/kredika-logo.svg" 
          alt="Kredika" 
          className="kredika-logo"
        />
        <p>Powered by Kredika - Flexible payment solutions</p>
      </div>
    </div>
  );
};

export default KredikaInstallmentOptions;
```

---

## 3. Appel API au Backend - Créer la Commande

### Service API Frontend

```javascript
// src/services/orderService.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api/v1';

const orderService = {
  /**
   * Créer une commande (avec paiement Kredika ou autre)
   */
  createOrder: async (orderData) => {
    try {
      const response = await axios.post(`${API_URL}/orders`, orderData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Récupérer les détails d'une commande
   */
  getOrder: async (orderId) => {
    try {
      const response = await axios.get(`${API_URL}/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching order:', error);
      throw error;
    }
  },

  /**
   * Récupérer les détails de paiement Kredika
   */
  getKredikaPaymentDetails: async (orderId) => {
    try {
      const response = await axios.get(
        `${API_URL}/orders/${orderId}/kredika/payment-details`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error fetching Kredika payment details:', error);
      throw error;
    }
  }
};

export default orderService;
```

---

## 4. Composant Checkout Complet

### Checkout avec Gestion Kredika

```jsx
// CheckoutFlow.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CheckoutPaymentMethod from './CheckoutPaymentMethod';
import KredikaInstallmentOptions from './KredikaInstallmentOptions';
import KredikaPaymentConfirmation from './KredikaPaymentConfirmation';
import orderService from '../services/orderService';
import './CheckoutFlow.css';

const CheckoutFlow = ({ cartItems }) => {
  const navigate = useNavigate();
  
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [installments, setInstallments] = useState(6);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [orderCreated, setOrderCreated] = useState(null);
  const [kredikaPaymentInfo, setKredikaPaymentInfo] = useState(null);

  // Calcul du total
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal >= 100 ? 0 : 9.99;
  const tax = subtotal * 0.20; // 20% VAT
  const total = subtotal + shipping + tax;

  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
    setInstallments(method === 'kredika' ? 6 : 1);
  };

  const handleInstallmentChange = (count) => {
    setInstallments(count);
  };

  const handleSubmitOrder = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1️⃣ Préparer les données de la commande
      const orderPayload = {
        items: cartItems.map(item => ({
          productId: item.id,
          quantity: item.quantity
        })),
        shippingAddress: {
          // Données du formulaire d'adresse
          street: document.getElementById('shipping-street').value,
          city: document.getElementById('shipping-city').value,
          postalCode: document.getElementById('shipping-postal').value,
          country: document.getElementById('shipping-country').value
        },
        paymentMethod: paymentMethod,
        ...(paymentMethod === 'kredika' && { installments })
      };

      console.log('📦 Envoi de la commande:', orderPayload);

      // 2️⃣ Appeler le backend pour créer la commande
      const orderResponse = await orderService.createOrder(orderPayload);
      
      console.log('✅ Commande créée:', orderResponse);
      setOrderCreated(orderResponse.order);

      // 3️⃣ Si Kredika, récupérer les infos de paiement
      if (paymentMethod === 'kredika' && orderResponse.order._id) {
        const kredikaDetails = await orderService.getKredikaPaymentDetails(
          orderResponse.order._id
        );
        
        console.log('💳 Détails Kredika reçus:', kredikaDetails);
        setKredikaPaymentInfo(kredikaDetails);

        // Redirection vers écran de confirmation Kredika
        return;
      }

      // 4️⃣ Si carte bancaire, rediriger vers Stripe
      if (paymentMethod === 'card') {
        navigate('/payment-processing', { state: { order: orderResponse.order } });
      }

    } catch (err) {
      console.error('❌ Erreur lors de la création de commande:', err);
      setError(err.message || 'Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  // Affichage de l'écran de confirmation Kredika
  if (kredikaPaymentInfo) {
    return (
      <KredikaPaymentConfirmation
        order={orderCreated}
        paymentInfo={kredikaPaymentInfo}
        total={total}
      />
    );
  }

  return (
    <div className="checkout-container">
      <div className="checkout-header">
        <h1>🛒 Finalisez votre achat</h1>
      </div>

      <div className="checkout-content">
        
        {/* Colonne de gauche: Formulaire */}
        <div className="checkout-form">
          
          {/* Résumé du panier */}
          <div className="order-summary">
            <h3>Résumé de votre commande</h3>
            <div className="summary-items">
              {cartItems.map(item => (
                <div key={item.id} className="summary-item">
                  <span>{item.name} x{item.quantity}</span>
                  <span>{item.price * item.quantity}€</span>
                </div>
              ))}
            </div>
            <div className="summary-divider" />
            <div className="summary-total">
              <div className="summary-line">
                <span>Sous-total:</span>
                <span>{subtotal.toFixed(2)}€</span>
              </div>
              <div className="summary-line">
                <span>Livraison:</span>
                <span>{shipping.toFixed(2)}€</span>
              </div>
              <div className="summary-line">
                <span>Taxes:</span>
                <span>{tax.toFixed(2)}€</span>
              </div>
              <div className="summary-line total">
                <span>Total:</span>
                <span className="amount">{total.toFixed(2)}€</span>
              </div>
            </div>
          </div>

          {/* Adresse de livraison */}
          <div className="shipping-address-section">
            <h3>📍 Adresse de Livraison</h3>
            <input 
              id="shipping-street"
              type="text" 
              placeholder="Rue et numéro" 
              className="input-field"
            />
            <input 
              id="shipping-city"
              type="text" 
              placeholder="Ville" 
              className="input-field"
            />
            <input 
              id="shipping-postal"
              type="text" 
              placeholder="Code postal" 
              className="input-field"
            />
            <input 
              id="shipping-country"
              type="text" 
              placeholder="Pays" 
              className="input-field"
            />
          </div>

          {/* Mode de paiement */}
          <CheckoutPaymentMethod 
            onPaymentMethodChange={handlePaymentMethodChange}
            onInstallmentChange={handleInstallmentChange}
            total={total}
          />

          {/* Message d'erreur */}
          {error && (
            <div className="error-message">
              ❌ {error}
            </div>
          )}

          {/* Bouton de confirmation */}
          <button
            className="checkout-submit-btn"
            onClick={handleSubmitOrder}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner" />
                Traitement en cours...
              </>
            ) : (
              `Confirmer l'achat (${total.toFixed(2)}€)`
            )}
          </button>

          <div className="security-info">
            🔒 Paiement 100% sécurisé | Données chiffrées
          </div>
        </div>

        {/* Colonne de droite: Info Kredika */}
        {paymentMethod === 'kredika' && (
          <div className="kredika-info-sidebar">
            <div className="info-card">
              <h3>💬 Pourquoi Kredika?</h3>
              <ul>
                <li>✅ Paiement en plusieurs fois</li>
                <li>✅ Sans frais supplémentaires</li>
                <li>✅ Décision instantanée</li>
                <li>✅ Flexible selon vos besoins</li>
              </ul>
            </div>
            <div className="info-card kredika-badge">
              <img src="/kredika-badge.svg" alt="Kredika Certified" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckoutFlow;
```

---

## 5. Écran de Confirmation Kredika

### Afficher les Détails de Paiement

```jsx
// KredikaPaymentConfirmation.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './KredikaPaymentConfirmation.css';

const KredikaPaymentConfirmation = ({ order, paymentInfo, total }) => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    // Redirection auto après 10 secondes
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          // Rediriger vers les instructions de paiement Kredika
          if (paymentInfo?.paymentInstructions?.redirectUrl) {
            window.location.href = paymentInfo.paymentInstructions.redirectUrl;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [paymentInfo]);

  const handleRedirectToKredika = () => {
    if (paymentInfo?.paymentInstructions?.redirectUrl) {
      window.location.href = paymentInfo.paymentInstructions.redirectUrl;
    } else if (paymentInfo?.paymentInstructions?.bankAccount) {
      // Si virement bancaire
      showBankTransferDetails();
    }
  };

  const showBankTransferDetails = () => {
    // Afficher les détails du virement
    console.log('Détails du virement:', paymentInfo.paymentInstructions.bankAccount);
  };

  const reservationId = paymentInfo?.creditReservationId || order?.payment?.kredika?.reservationId;
  const installments = paymentInfo?.installments || order?.payment?.kredika?.installments || [];
  const monthlyPayment = paymentInfo?.monthlyPayment || order?.payment?.kredika?.monthlyPayment || 0;

  return (
    <div className="kredika-confirmation-container">
      
      {/* Écran de succès */}
      <div className="success-screen">
        <div className="success-icon">✅</div>
        <h1>Commande Créée!</h1>
        <p>Votre réservation Kredika a été créée avec succès.</p>

        {/* Numéro de commande */}
        <div className="order-number">
          <strong>Numéro de commande:</strong>
          <code>{order?.orderNumber}</code>
        </div>

        {/* ID de réservation Kredika */}
        <div className="reservation-id">
          <strong>ID Réservation Kredika:</strong>
          <code>{reservationId}</code>
        </div>
      </div>

      {/* Détails du plan de paiement */}
      <div className="payment-plan-section">
        <h2>📊 Votre Plan de Paiement</h2>

        <div className="payment-summary">
          <div className="summary-item">
            <span>Montant total:</span>
            <strong>{total.toFixed(2)}€</strong>
          </div>
          <div className="summary-item">
            <span>Nombre de versements:</span>
            <strong>{installments.length}</strong>
          </div>
          <div className="summary-item highlight">
            <span>Mensualité:</span>
            <strong>{(monthlyPayment / 100).toFixed(2)}€</strong>
          </div>
        </div>

        {/* Tableau des versements */}
        <div className="installments-table">
          <h3>Détail des versements</h3>
          <div className="table-header">
            <div>Versement</div>
            <div>Montant</div>
            <div>Date d'échéance</div>
            <div>Statut</div>
          </div>
          {installments.map((inst, idx) => (
            <div key={idx} className="table-row">
              <div>{idx + 1}</div>
              <div>{(inst.amount / 100).toFixed(2)}€</div>
              <div>{new Date(inst.dueDate).toLocaleDateString('fr-FR')}</div>
              <div className={`status ${inst.status.toLowerCase()}`}>
                {inst.status}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Instruction de paiement */}
      <div className="payment-instructions">
        <h2>🔗 Procéder au Paiement</h2>
        
        {paymentInfo?.paymentInstructions?.redirectUrl ? (
          <div className="redirect-instruction">
            <p>Vous allez être redirigé vers Kredika pour finaliser votre paiement.</p>
            <button 
              className="kredika-redirect-btn"
              onClick={handleRedirectToKredika}
            >
              Aller à Kredika →
            </button>
            <p className="redirect-countdown">
              Redirection automatique dans {countdown}s...
            </p>
          </div>
        ) : paymentInfo?.paymentInstructions?.bankAccount ? (
          <div className="bank-transfer-instruction">
            <h3>Virement Bancaire</h3>
            <div className="bank-details">
              <div className="detail-item">
                <label>IBAN:</label>
                <code>{paymentInfo.paymentInstructions.bankAccount.iban}</code>
              </div>
              <div className="detail-item">
                <label>BIC:</label>
                <code>{paymentInfo.paymentInstructions.bankAccount.bic}</code>
              </div>
              <div className="detail-item">
                <label>Bénéficiaire:</label>
                <code>{paymentInfo.paymentInstructions.bankAccount.beneficiary}</code>
              </div>
              <div className="detail-item">
                <label>Référence:</label>
                <code>{reservationId}</code>
                <button className="copy-btn" onClick={() => copyToClipboard(reservationId)}>
                  Copier
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Prochaines étapes */}
      <div className="next-steps">
        <h3>📋 Vos Prochaines Étapes</h3>
        <ol>
          <li><strong>Allez à Kredika:</strong> Cliquez sur le bouton ci-dessus</li>
          <li><strong>Complétez la demande:</strong> Remplissez les informations requises</li>
          <li><strong>Recevez la décision:</strong> Obtenue instantanément</li>
          <li><strong>Effectuez le paiement:</strong> Selon les instructions reçues</li>
          <li><strong>Recevez votre commande:</strong> Après confirmation du paiement</li>
        </ol>
      </div>

      {/* Bouton retour */}
      <button 
        className="back-to-shop-btn"
        onClick={() => navigate('/products')}
      >
        ← Retour à la boutique
      </button>

    </div>
  );
};

const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text);
  alert('Copié!');
};

export default KredikaPaymentConfirmation;
```

---

## 6. Gestion des Webhooks Kredika (Optionnel - Backend)

Quand le client effectue le paiement, Kredika envoie un webhook pour confirmer. Le backend doit l'écouter:

```javascript
// src/routes/webhooks.js
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const kredikaService = require('../services/kredikaService');

/**
 * Webhook pour les mises à jour de statut Kredika
 * POST /api/v1/webhooks/kredika
 */
router.post('/kredika', async (req, res) => {
  try {
    const { event, data } = req.body;

    console.log(`📨 Webhook Kredika reçu: ${event}`, data);

    // Vérifier la signature du webhook (sécurité)
    const isValid = kredikaService.verifyWebhookSignature(
      req.body,
      req.headers['x-kredika-signature']
    );

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }

    // Traiter les différents événements
    switch (event) {
      case 'reservation.completed':
        await handleReservationCompleted(data);
        break;
      case 'reservation.declined':
        await handleReservationDeclined(data);
        break;
      case 'payment.confirmed':
        await handlePaymentConfirmed(data);
        break;
      case 'installment.paid':
        await handleInstallmentPaid(data);
        break;
      default:
        console.log(`Event inconnu: ${event}`);
    }

    res.json({ success: true, event });

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

const handleReservationCompleted = async (data) => {
  const { externalOrderRef, creditReservationId, status } = data;
  
  const order = await Order.findOne({ orderNumber: externalOrderRef });
  if (order) {
    order.payment.kredika.status = status;
    order.payment.status = 'confirmed';
    await order.save();
    console.log(`✅ Réservation confirmée: ${externalOrderRef}`);
  }
};

const handleReservationDeclined = async (data) => {
  const { externalOrderRef, reason } = data;
  
  const order = await Order.findOne({ orderNumber: externalOrderRef });
  if (order) {
    order.payment.kredika.status = 'declined';
    order.payment.kredika.declineReason = reason;
    order.payment.status = 'failed';
    await order.save();
    console.log(`❌ Réservation refusée: ${externalOrderRef} - ${reason}`);
  }
};

const handlePaymentConfirmed = async (data) => {
  const { externalOrderRef, creditReservationId } = data;
  
  const order = await Order.findOne({ orderNumber: externalOrderRef });
  if (order) {
    order.payment.status = 'completed';
    order.payment.kredika.lastWebhookEvent = 'payment.confirmed';
    order.payment.kredika.lastWebhookAt = new Date();
    await order.save();
    console.log(`💰 Paiement confirmé: ${externalOrderRef}`);
    
    // TODO: Envoyer email de confirmation
    // TODO: Créer un shipping order
  }
};

const handleInstallmentPaid = async (data) => {
  const { externalOrderRef, installmentNumber, amount, creditReservationId } = data;
  
  const order = await Order.findOne({ orderNumber: externalOrderRef });
  if (order) {
    const installmentIdx = installmentNumber - 1;
    if (order.payment.kredika.installments[installmentIdx]) {
      order.payment.kredika.installments[installmentIdx].status = 'PAID';
      order.payment.kredika.lastWebhookEvent = 'installment.paid';
      order.payment.kredika.lastWebhookAt = new Date();
      await order.save();
      console.log(`💵 Versement payé: ${externalOrderRef} - Versement ${installmentNumber}`);
    }
  }
};

module.exports = router;
```

---

## 7. Styles CSS (Exemple)

```css
/* CheckoutPaymentMethod.css */

.payment-method-section {
  background: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.payment-options {
  display: flex;
  gap: 15px;
  margin-top: 15px;
}

.payment-option {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 15px;
  border: 2px solid #ddd;
  border-radius: 8px;
  flex: 1;
  transition: all 0.3s;
}

.payment-option:hover {
  border-color: #007bff;
  background: #f0f7ff;
}

.payment-option input[type="radio"] {
  margin-right: 15px;
  cursor: pointer;
  width: 20px;
  height: 20px;
}

.payment-option.kredika-option {
  border: 2px solid #008ee7;
  background: #e6f4fb;
}

.payment-option.kredika-option.active {
  background: #d4ebf7;
  border-color: #008ee7;
}

.option-content h3 {
  margin: 0 0 5px 0;
  font-size: 16px;
  color: #333;
}

.option-content p {
  margin: 0;
  font-size: 13px;
  color: #666;
}

.kredika-badge {
  display: inline-block;
  background: #008ee7;
  color: white;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 11px;
  margin-top: 5px;
}

/* KredikaInstallmentOptions.css */

.kredika-installment-section {
  background: white;
  border: 2px solid #008ee7;
  border-radius: 8px;
  padding: 20px;
  margin-top: 15px;
}

.installment-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 10px;
  margin-top: 15px;
}

.installment-btn {
  padding: 15px;
  border: 2px solid #ddd;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  text-align: center;
  transition: all 0.3s;
  font-size: 13px;
}

.installment-btn:hover {
  border-color: #008ee7;
  background: #f0f7ff;
}

.installment-btn.active {
  border-color: #008ee7;
  background: #008ee7;
  color: white;
}

.option-label {
  font-weight: bold;
  margin-bottom: 5px;
}

.option-amount {
  font-size: 12px;
  color: #666;
}

.installment-btn.active .option-amount {
  color: #ddd;
}

.installment-details {
  background: #f9f9f9;
  padding: 15px;
  border-radius: 6px;
  margin-top: 15px;
}

.installment-details h4 {
  margin: 0 0 10px 0;
  color: #333;
}

.installment-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.installment-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: white;
  border-radius: 4px;
  font-size: 13px;
}

.installment-item .date {
  color: #999;
  font-size: 11px;
}

.installment-item.collapsed {
  color: #999;
  font-style: italic;
}

/* KredikaPaymentConfirmation.css */

.kredika-confirmation-container {
  max-width: 600px;
  margin: 40px auto;
  padding: 40px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.success-screen {
  text-align: center;
  margin-bottom: 40px;
}

.success-icon {
  font-size: 60px;
  margin-bottom: 20px;
}

.success-screen h1 {
  color: #008ee7;
  margin: 20px 0 10px;
}

.order-number,
.reservation-id {
  background: #f9f9f9;
  padding: 15px;
  border-radius: 6px;
  margin-top: 15px;
  text-align: left;
}

.order-number strong,
.reservation-id strong {
  display: block;
  color: #666;
  margin-bottom: 8px;
  font-size: 12px;
}

.order-number code,
.reservation-id code {
  background: white;
  padding: 8px 12px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  color: #008ee7;
  font-weight: bold;
  word-break: break-all;
}

.payment-plan-section {
  margin-bottom: 40px;
}

.payment-plan-section h2 {
  color: #333;
  margin-bottom: 20px;
  border-bottom: 2px solid #008ee7;
  padding-bottom: 10px;
}

.payment-summary {
  background: #f9f9f9;
  padding: 15px;
  border-radius: 6px;
  margin-bottom: 20px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #eee;
  font-size: 14px;
}

.summary-item:last-child {
  border-bottom: none;
}

.summary-item.highlight {
  background: #e6f4fb;
  padding: 15px;
  border-radius: 4px;
  font-weight: bold;
  color: #008ee7;
  border-bottom: none;
  margin-top: 10px;
}

.installments-table {
  border: 1px solid #ddd;
  border-radius: 6px;
  overflow: hidden;
}

.table-header {
  display: grid;
  grid-template-columns: 1fr 1fr 1.5fr 1fr;
  gap: 10px;
  padding: 15px;
  background: #008ee7;
  color: white;
  font-weight: bold;
  font-size: 12px;
}

.table-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1.5fr 1fr;
  gap: 10px;
  padding: 12px 15px;
  border-bottom: 1px solid #eee;
  align-items: center;
  font-size: 13px;
}

.table-row:last-child {
  border-bottom: none;
}

.table-row .status {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: bold;
  text-align: center;
}

.table-row .status.pending {
  background: #fff3cd;
  color: #856404;
}

.table-row .status.paid {
  background: #d4edda;
  color: #155724;
}

.payment-instructions {
  background: #f0f7ff;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
}

.payment-instructions h2 {
  color: #008ee7;
  margin-top: 0;
}

.kredika-redirect-btn {
  background: #008ee7;
  color: white;
  border: none;
  padding: 15px 30px;
  border-radius: 6px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  width: 100%;
  margin-top: 15px;
  transition: background 0.3s;
}

.kredika-redirect-btn:hover {
  background: #0077c8;
}

.redirect-countdown {
  color: #666;
  font-size: 12px;
  margin-top: 10px;
  text-align: center;
}

.next-steps {
  background: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.next-steps ol {
  margin: 10px 0;
  padding-left: 20px;
}

.next-steps li {
  margin-bottom: 10px;
  line-height: 1.6;
}

.back-to-shop-btn {
  width: 100%;
  padding: 12px;
  background: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.3s;
}

.back-to-shop-btn:hover {
  background: #e0e0e0;
}
```

---

## 8. Flow Résumé

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND FLOW                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Client sélectionne "Kredika" comme mode de paiement    │
│                                                              │
│  2. Afficher les options d'installments (1, 3, 6, 12 mois)  │
│                                                              │
│  3. Client remplit l'adresse de livraison                   │
│                                                              │
│  4. Clic sur "Confirmer l'achat"                            │
│                                                              │
│  5. Appeler POST /api/v1/orders avec:                       │
│     - items (produits du panier)                            │
│     - shippingAddress                                       │
│     - paymentMethod: 'kredika'                              │
│     - installments: 6 (ou autre nombre)                     │
│                                                              │
│  6. Backend crée la commande et Kredika reservation         │
│     (calcule les versements, remplit le profil client)      │
│                                                              │
│  7. Réponse avec:                                           │
│     - order details                                         │
│     - kredika.reservationId                                 │
│     - kredika.installments (tableau des versements)         │
│     - kredika.paymentInstructions (redirect URL ou IBAN)    │
│                                                              │
│  8. Afficher écran de confirmation avec détails             │
│                                                              │
│  9. Redirection auto ou manuel vers Kredika                 │
│                                                              │
│ 10. Client complète le paiement sur Kredika                 │
│                                                              │
│ 11. Webhook de Kredika confirme le paiement (backend)       │
│                                                              │
│ 12. Email de confirmation et numéro de suivi (backend)      │
│                                                              │
│ 13. Client peut voir l'historique des versements            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 9. Points Importants

### ✅ À Faire:
- Valider l'adresse de livraison côté client ET serveur
- Afficher les frais (livraison, taxes) dans le résumé
- Afficher clairement le montant des versements
- Tester le flow complet (cart → checkout → Kredika → confirmation)
- Implémenter la gestion des webhooks pour mettre à jour le statut
- Envoyer des emails de confirmation
- Gérer les cas d'erreur (produits en rupture de stock, etc.)

### ❌ À Éviter:
- Ne pas envoyer les montants en euros bruts (toujours en centimes)
- Ne pas oublier le token JWT dans les headers
- Ne pas exposer les clés Kredika au frontend (seulement utilisateur/commande infos)
- Ne pas rediriger avant de récupérer la réservation complète
- Ne pas faire confiance aux données du frontend pour le total (toujours recalculer au backend)

---

## 10. Exemple Complet d'Appel API

```javascript
// Dans le composant CheckoutFlow
const handleSubmitOrder = async () => {
  const orderPayload = {
    items: [
      { productId: '507f1f77bcf86cd799439011', quantity: 2 },
      { productId: '507f1f77bcf86cd799439012', quantity: 1 }
    ],
    shippingAddress: {
      street: '123 Rue de la Paix',
      city: 'Paris',
      postalCode: '75001',
      country: 'France'
    },
    paymentMethod: 'kredika',
    installments: 6
  };

  try {
    const response = await fetch('http://localhost:3000/api/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(orderPayload)
    });

    const result = await response.json();

    if (result.success) {
      // Afficher la confirmation Kredika
      setKredikaPaymentInfo({
        creditReservationId: result.kredika.reservationId,
        installments: result.kredika.installments,
        monthlyPayment: result.kredika.monthlyPayment,
        paymentInstructions: result.kredika.paymentInstructions
      });

      // Redirection auto après 3 secondes
      setTimeout(() => {
        window.location.href = result.kredika.paymentInstructions.redirectUrl;
      }, 3000);
    }
  } catch (error) {
    console.error('Erreur:', error);
  }
};
```

---

## Conclusion

L'intégration Kredika côté frontend est essentiellement:
1. **Sélectionner** Kredika comme mode de paiement
2. **Choisir** le nombre d'installments
3. **Envoyer** les données au backend
4. **Afficher** les détails de paiement reçus
5. **Rediriger** vers Kredika

Le backend s'occupe du reste (vérifications, sécurité, webhooks). 🎉
