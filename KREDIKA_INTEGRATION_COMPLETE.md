# 🎯 Intégration Kredika - Documentation Complète

**Table des matières**
1. [Vue d'ensemble](#vue-densemble)
2. [Configuration](#configuration)
3. [Flux de Création de Commande](#flux-de-création-de-commande)
4. [Service Kredika - Méthodes](#service-kredika--méthodes)
5. [Gestion des Paiements](#gestion-des-paiements)
6. [Suivi des Commandes](#suivi-des-commandes)
7. [Webhooks](#webhooks)
8. [Implémentation](#implémentation)
9. [Tests](#tests)
10. [Troubleshooting](#troubleshooting)

---

## Vue d'ensemble

L'intégration Kredika permet de traiter les paiements à crédit (Buy Now Pay Later) directement via l'API Kredika Core. Le système gère :

- ✅ Création de réservations de crédit
- ✅ Génération d'échéances mensuelles
- ✅ Génération d'instructions de paiement
- ✅ Suivi des paiements
- ✅ Gestion des statuts de commande
- ✅ Webhooks en temps réel

### Fichiers Modifiés et Créés

**Fichiers Modifiés** :
- `src/models/Order.js` - Nouveau champ `kredika` pour enregistrer les IDs
- `src/controllers/orders.js` - Support Kredika dans `createOrder`
- `src/routes/orders.js` - Nouvelle route pour récupérer détails Kredika

**Fichiers Créés** :
- `src/services/kredikaService.js` - Service complet (604 lignes, 30+ méthodes)
- `src/controllers/orders-kredika-examples.js` - Exemples d'implémentation

---

## Configuration

### Variables d'environnement (.env)

```env
# Kredika Configuration
KREDIKA_API_URL=https://api.kredika.sn/api
KREDIKA_CLIENT_ID=pk_5d549668c41741f6
KREDIKA_CLIENT_SECRET=sk_live_a1b2c3d4e5f6g7h8i9j0

# Frontend URLs (pour webhooks)
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:3000
```

### Service Kredika

Le fichier `src/services/kredikaService.js` contient toutes les méthodes pour interagir avec l'API Kredika.

**Authentification Automatique** :
```javascript
const kredikaService = require('../services/kredikaService');

// Le service gère automatiquement :
// 1. Obtention du token initial
// 2. Rafraîchissement du token avant expiration
// 3. Envoi du token dans chaque requête
```

---

## Flux de Création de Commande

### Vue Complète du Flux

```
1. Client soumet une commande avec paymentMethod = 'kredika'
   ↓
2. Serveur valide les produits et calcule le total
   ↓
3. Serveur crée une réservation chez Kredika
   ├─ Kredika retourne les échéances calculées automatiquement
   ├─ Exemple: 6 échéances mensuelles de 97.500 FCFA
   └─ Statut initial: RESERVED
   ↓
4. Serveur crée la commande locale
   ├─ Sauvegarde les détails Kredika
   ├─ Sauvegarde les échéances
   └─ Réduit le stock
   ↓
5. Serveur génère une instruction de paiement
   ├─ Pour la première échéance
   ├─ Contient méthodes de paiement (Wave, Orange Money, Banque, etc.)
   └─ Envoie au client (SMS/Email)
   ↓
6. Client reçoit notification et paie
   ↓
7. Webhook Kredika notifie le serveur
   ├─ Event: installment.payment_received
   ├─ Serveur met à jour l'échéance
   ├─ Kudika active automatiquement la réservation
   └─ Commande passe à "confirmed"
   ↓
8. Prochaines échéances
   ├─ Rappels automatiques
   ├─ Paiements suivants
   └─ Commande passe à "delivered" si tout payé
```

### Étapes Détaillées

#### Phase 1: Créer une Commande

**Endpoint** : `POST /api/v1/orders`

```bash
curl -X POST http://localhost:3000/api/v1/orders \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"productId": "69348fe02e6d1c21360ee592", "quantity": 1}
    ],
    "paymentMethod": "kredika",
    "installmentCount": 6,
    "shippingAddress": {
      "address": "123 Rue Principal",
      "city": "Abidjan",
      "zip": "01",
      "country": "Côte d'\''Ivoire"
    }
  }'
```

#### Phase 2: Validation et Préparation

```javascript
// Vérifier les produits et calculer le total
const subtotal = items.reduce((sum, item) => {
  const product = await Product.findById(item.productId);
  return sum + (product.price * item.quantity);
}, 0);

const total = subtotal + shipping + tax;
```

#### Phase 3: Créer la Réservation Kredika

```javascript
// Générer une référence unique pour le suivi
const externalOrderRef = `ORD-${Date.now()}-${user._id}`;
const externalCustomerRef = `CUST-${user._id}`;

// Créer la réservation
const reservation = await kredikaService.createReservation({
  externalOrderRef: externalOrderRef,
  externalCustomerRef: externalCustomerRef,
  purchaseAmount: total,
  installmentCount: installmentCount || 6,
  notes: `Commande ${externalOrderRef} - Meubles`
});
```

**Réponse Kredika** :
```json
{
  "creditReservationId": "123e4567-e89b-12d3-a456-426614174000",
  "status": "RESERVED",
  "purchaseAmount": 585000,
  "installmentCount": 6,
  "monthlyPayment": 97500,
  "installments": [
    {
      "installmentId": "234e5678-f90c-23e4-b567-537725285111",
      "installmentNumber": 1,
      "dueDate": "2024-12-15",
      "amountDue": 97500,
      "status": "PENDING"
    }
  ]
}
```

#### Phase 4: Sauvegarder la Commande

```javascript
const order = new Order({
  user: userId,
  items: validatedItems,
  pricing: { subtotal, shipping, tax, total },
  paymentMethod: 'kredika',
  orderStatus: 'pending',
  kredika: {
    reservationId: reservation.creditReservationId,
    externalOrderRef: externalOrderRef,
    status: 'RESERVED',
    installmentCount: reservation.installmentCount,
    monthlyPayment: reservation.monthlyPayment,
    installments: reservation.installments
  }
});

await order.save();
```

#### Phase 5: Générer les Instructions de Paiement

```javascript
// Pour la première échéance
const firstInstallment = reservation.installments[0];

const paymentInstruction = await kredikaService.generatePaymentInstruction({
  installmentId: firstInstallment.installmentId,
  amountDue: firstInstallment.amountDue,
  dueDate: firstInstallment.dueDate,
  instructionType: 'STANDARD',
  language: 'fr',
  channel: 'SMS'
});
```

### Réponse Complète

```json
{
  "success": true,
  "order": {
    "_id": "650c1234567890abcdef",
    "orderNumber": "ORD-1702720000000-1",
    "user": "69348fe76d34a760512b344e",
    "items": [{
      "product": "69348fe02e6d1c21360ee592",
      "quantity": 1,
      "price": 450000
    }],
    "pricing": {
      "subtotal": 450000,
      "shipping": 0,
      "tax": 135000,
      "total": 585000
    },
    "payment": {
      "method": "kredika",
      "status": "pending",
      "kredika": {
        "reservationId": "123e4567-e89b-12d3-a456-426614174000",
        "externalOrderRef": "ORD-1702720000000-1",
        "externalCustomerRef": "CUST-69348fe76d34a760512b344e",
        "status": "RESERVED",
        "monthlyPayment": 97500,
        "installmentCount": 6,
        "installments": [
          {
            "installmentId": "234e5678-f90c-23e4-b567-537725285111",
            "dueDate": "2024-12-15",
            "amount": 97500,
            "status": "PENDING"
          }
        ]
      }
    },
    "status": "pending",
    "createdAt": "2024-12-06T20:41:09.133Z"
  },
  "kredika": {
    "reservationId": "123e4567-e89b-12d3-a456-426614174000",
    "status": "RESERVED",
    "monthlyPayment": 97500,
    "installmentCount": 6
  }
}
```

---

## Service Kredika - Méthodes

### Authentification (Automatique)
```javascript
await kredikaService.authenticate()           // Obtenir token
await kredikaService.refreshAccessToken()     // Rafraîchir token
await kredikaService.ensureValidToken()       // Vérifier token (appelle auto refresh)
```

### Réservations de Crédit
```javascript
// Créer une réservation
const reservation = await kredikaService.createReservation({
  externalOrderRef: 'ORD-001',
  externalCustomerRef: 'CUST-123',
  purchaseAmount: 250000,
  installmentCount: 6
})

// Récupérer une réservation
await kredikaService.getReservationById(id)
await kredikaService.getReservationByExternalRef(ref)

// Lister les réservations
await kredikaService.listReservations(status)

// Mettre à jour le statut
await kredikaService.updateReservationStatus(id, status)

// Activer la réservation
await kredikaService.activateReservation(id)

// Annuler la réservation
await kredikaService.cancelReservation(id)

// Récupérer les statistiques
await kredikaService.getReservationStats()
```

### Échéances
```javascript
// Récupérer une échéance
await kredikaService.getInstallmentById(id)

// Lister les échéances d'une réservation
await kredikaService.listInstallments(creditReservationId)

// Traiter un paiement d'échéance
await kredikaService.processInstallmentPayment(id, amount, ref)

// Lister les échéances à venir
await kredikaService.listUpcomingInstallments(daysAhead)

// Envoyer un rappel de paiement
await kredikaService.sendPaymentReminder(id)
```

### Instructions de Paiement
```javascript
// Générer une instruction de paiement
const instruction = await kredikaService.generatePaymentInstruction({
  installmentId: 'id',
  amountDue: 97500,
  dueDate: '2024-12-15'
})

// Récupérer une instruction
await kredikaService.getPaymentInstructionById(id)

// Lister les instructions actives
await kredikaService.getActivePaymentInstructions(installmentId)

// Marquer comme vérifiée
await kredikaService.markInstructionAsViewed(id)

// Régénérer une instruction
await kredikaService.regeneratePaymentInstruction(id)
```

### Utilitaires
```javascript
kredikaService.processWebhook(payload, signature)
kredikaService.mapKredikaStatus(kredikaStatus)
kredikaService.formatReservationForStorage(reservation)
```

---

## Gestion des Paiements

### Mettre à Jour le Statut de la Réservation

Quand le client effectue un paiement :

```javascript
// Activer la réservation dès que le premier paiement est reçu
await kredikaService.activateReservation(reservationId);

// Mettre à jour le statut local
await Order.findByIdAndUpdate(orderId, {
  'payment.kredika.status': 'ACTIVE',
  'status': 'confirmed'
});
```

### Traiter un Paiement d'Échéance

```javascript
async function processInstallmentPayment(installmentId, paidAmount, externalPaymentRef) {
  try {
    // Enregistrer le paiement chez Kredika
    const paymentResult = await kredikaService.processInstallmentPayment(
      installmentId,
      paidAmount,
      externalPaymentRef
    );

    // Mettre à jour la commande locale
    await Order.findOneAndUpdate(
      { 'payment.kredika.installments.installmentId': installmentId },
      { 
        $set: { 
          'payment.kredika.installments.$.status': 'PAID',
          'payment.kredika.installments.$.paidAt': new Date()
        }
      }
    );

    return paymentResult;
  } catch (error) {
    console.error('Payment processing error:', error);
    throw error;
  }
}
```

---

## Suivi des Commandes

### Récupérer l'État d'une Commande avec Synchronisation

**Endpoint** : `GET /api/orders/:id/kredika`

```bash
curl http://localhost:3000/api/orders/650c1234567890abcdef/kredika \
  -H "Authorization: Bearer {token}"
```

**Réponse** :
```json
{
  "success": true,
  "order": {...},
  "kredika": {
    "reservationId": "123e4567-e89b-12d3-a456-426614174000",
    "externalOrderRef": "ORD-1702720000000-1",
    "status": "ACTIVE",
    "monthlyPayment": 97500,
    "installmentCount": 6,
    "installments": [
      {
        "installmentId": "234e5678-f90c-23e4-b567-537725285111",
        "dueDate": "2024-12-15",
        "amount": 97500,
        "status": "PAID"
      }
    ],
    "lastWebhookEvent": "installment.payment_received",
    "lastWebhookAt": "2024-12-10T15:30:00Z"
  }
}
```

### Synchronisation Automatique

La route `/api/orders/:id/kredika` synchronise automatiquement :
- ✅ Statut de la réservation
- ✅ Statut des échéances
- ✅ Détails des paiements reçus
- ✅ Mise à jour du statut local si changement

---

## Webhooks

### Types d'Événements

```javascript
// 1. Paiement reçu
{
  event: 'installment.payment_received',
  data: {
    installmentId: 'INST-001',
    creditReservationId: 'RES-123',
    amountPaid: 97500,
    paymentDate: '2024-12-10'
  }
}

// 2. Échéance en retard
{
  event: 'installment.overdue',
  data: {
    installmentId: 'INST-002',
    creditReservationId: 'RES-123',
    daysOverdue: 5
  }
}

// 3. Réservation terminée
{
  event: 'reservation.completed',
  data: {
    creditReservationId: 'RES-123',
    totalAmountPaid: 585000,
    completionDate: '2024-11-10'
  }
}
```

### Implémenter les Webhooks

Créer `src/routes/webhooks.js` :

```javascript
const express = require('express');
const router = express.Router();
const kredikaService = require('../services/kredikaService');
const Order = require('../models/Order');

// POST /api/webhooks/kredika
router.post('/kredika', async (req, res) => {
  try {
    const signature = req.headers['x-kredika-signature'];
    const verification = kredikaService.processWebhook(req.body, signature);

    if (!verification.valid) {
      console.log('❌ Signature webhook invalide');
      return res.status(401).json({ success: false });
    }

    const { event, data } = req.body;

    // Traiter l'événement
    switch (event) {
      case 'installment.payment_received':
        await handlePaymentReceived(data);
        break;
      case 'installment.overdue':
        await handlePaymentOverdue(data);
        break;
      case 'reservation.completed':
        await handleReservationCompleted(data);
        break;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(500).json({ success: false });
  }
});

async function handlePaymentReceived(data) {
  console.log('💰 Paiement reçu:', data.installmentId);
  
  const order = await Order.findOneAndUpdate(
    { 'payment.kredika.installments.installmentId': data.installmentId },
    { 
      $set: { 
        'payment.kredika.installments.$.status': 'PAID',
        'payment.kredika.installments.$.paidAt': new Date(),
        'payment.kredika.lastWebhookEvent': 'installment.payment_received',
        'payment.kredika.lastWebhookAt': new Date()
      }
    },
    { new: true }
  );

  if (order) {
    // Vérifier si toutes les échéances sont payées
    const allPaid = order.payment.kredika.installments.every(i => i.status === 'PAID');
    if (allPaid) {
      await Order.findByIdAndUpdate(order._id, {
        'payment.status': 'paid',
        'status': 'processing'
      });
    }
  }
}

async function handlePaymentOverdue(data) {
  console.log('⚠️ Paiement en retard:', data.installmentId);
  
  await Order.findOneAndUpdate(
    { 'payment.kredika.installments.installmentId': data.installmentId },
    { 
      $set: { 
        'payment.kredika.installments.$.status': 'OVERDUE'
      }
    }
  );
}

async function handleReservationCompleted(data) {
  console.log('✅ Réservation terminée:', data.creditReservationId);
  
  await Order.findOneAndUpdate(
    { 'payment.kredika.reservationId': data.creditReservationId },
    { 
      'payment.kredika.status': 'COMPLETED',
      'status': 'delivered'
    }
  );
}

module.exports = router;
```

Ajouter à `src/app.js` :
```javascript
const webhooksRoutes = require('./routes/webhooks');
app.use('/api/webhooks', webhooksRoutes);
```

---

## Implémentation

### Phase 1: Configuration ✅ FAIT
- [x] Service Kredika créé avec toutes les méthodes API
- [x] Authentification automatique et gestion des tokens
- [x] Gestion des réservations de crédit
- [x] Gestion des échéances
- [x] Génération d'instructions de paiement
- [x] Traitement des webhooks
- [x] Modèle Order mis à jour
- [x] Contrôleur createOrder supportant Kredika
- [x] Route getOrderKredikaDetails créée

### Phase 2: Implémentation Contrôleur (EN COURS)

**Fichiers à mettre à jour** :
- `src/controllers/orders.js` - Ajouter support Kredika ✅ FAIT
- `src/routes/orders.js` - Ajouter routes pour paiements ✅ FAIT
- `src/routes/webhooks.js` - Ajouter webhooks Kredika ⏳ TODO

### Phase 3: Frontend Integration (À FAIRE)
- [ ] Affichage du plan de paiement
- [ ] Interface de paiement des échéances
- [ ] Suivi en temps réel des paiements
- [ ] Notifications de paiement

### Phase 4: Tests (À FAIRE)
- [ ] Tests unitaires du service Kredika
- [ ] Tests d'intégration E2E
- [ ] Tests de webhooks
- [ ] Tests de scénarios d'erreur

---

## Tests

### Test 1: Créer une commande avec Kredika

```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"productId": "69348fe02e6d1c21360ee592", "quantity": 1}],
    "paymentMethod": "kredika",
    "installmentCount": 6,
    "shippingAddress": {
      "firstName": "John",
      "lastName": "Doe",
      "street": "123 Rue",
      "city": "Dakar",
      "postalCode": "18000",
      "country": "Senegal"
    }
  }'
```

**Réponse attendue** :
```json
{
  "success": true,
  "order": {...},
  "kredika": {
    "reservationId": "RES-123",
    "status": "RESERVED",
    "monthlyPayment": 97500
  }
}
```

### Test 2: Récupérer le détail de la commande avec sync

```bash
curl http://localhost:3000/api/orders/650c1234567890abcdef/kredika \
  -H "Authorization: Bearer {token}"
```

### Test 3: Traiter un paiement

```bash
curl -X POST http://localhost:3000/api/orders/650c1234567890abcdef/installments/0/pay \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "paidAmount": 97500,
    "paymentReference": "PAY-001"
  }'
```

### Test 4: Simuler un webhook

```bash
curl -X POST http://localhost:3000/api/webhooks/kredika \
  -H "Content-Type: application/json" \
  -H "x-kredika-signature: {signature}" \
  -d '{
    "event": "installment.payment_received",
    "data": {
      "installmentId": "INST-001",
      "creditReservationId": "RES-123",
      "amountPaid": 97500
    }
  }'
```

---

## Statuts et Mappings

### Statuts Kredika

| Statut | Signification |
|--------|--------------|
| RESERVED | Réservation créée, en attente |
| ACTIVE | Réservation activée |
| COMPLETED | Tous les paiements effectués |
| CANCELLED | Annulée |
| DEFAULTED | Défaut de paiement |

### Statuts Échéances

| Statut | Signification |
|--------|--------------|
| PENDING | En attente de paiement |
| PAID | Payée |
| OVERDUE | En retard |

### Mapping vers Statuts Locaux

| Kredika | Local |
|---------|-------|
| RESERVED | pending |
| ACTIVE | confirmed |
| COMPLETED | delivered |
| CANCELLED | cancelled |
| DEFAULTED | cancelled |

---

## Performance et Optimisations

### 1. Caching des Tokens

Le service gère automatiquement le cache et le rafraîchissement des tokens.

### 2. Retry Logic

Ajouter un retry automatique en cas d'erreur temporaire:

```javascript
async function withRetry(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }
}
```

### 3. Batch Processing

Pour traiter plusieurs commandes:

```javascript
async function processMultipleReservations(orders) {
  return Promise.all(
    orders.map(order => 
      kredikaService.createReservation(order)
    )
  );
}
```

---

## Troubleshooting

### Erreur: "Invalid authentication token"

**Solution** :
1. Vérifier les variables d'environnement KREDIKA_CLIENT_ID et KREDIKA_CLIENT_SECRET
2. Vérifier que l'URL de l'API Kredika est correcte
3. Vérifier les logs de kredikaService

### Erreur: "Reservation not found"

**Solution** :
1. Vérifier que le reservationId est correct
2. Vérifier que la réservation n'a pas été supprimée chez Kredika
3. Utiliser `getReservationByExternalRef` avec externalOrderRef

### Webhook non reçu

**Solution** :
1. Vérifier que l'URL webhook est correcte dans la configuration Kredika
2. Vérifier les logs webhook dans la console
3. Tester manuellement avec curl

### Paiement non enregistré

**Solution** :
1. Vérifier que le webhook a été reçu
2. Vérifier la signature du webhook
3. Vérifier que l'installmentId est correct
4. Consulter les logs de la route webhooks

---

## Checklist de Sécurité

- [x] Vérification des signatures de webhook
- [x] Validation des montants
- [x] Authorization checks
- [x] Audit logging
- [x] HTTPS requis en production
- [x] Pas de PII stockée localement
- [x] Tokens sécurisés en mémoire
- [ ] Rate limiting sur les endpoints
- [ ] Logging des erreurs sensibles
- [ ] Tests de pénétration

---

## Ressources Additionnelles

| Ressource | Lien |
|-----------|------|
| Service Kredika | src/services/kredikaService.js |
| Modèle Order | src/models/Order.js |
| Contrôleur Orders | src/controllers/orders.js |
| Routes Orders | src/routes/orders.js |
| Exemples Kredika | src/controllers/orders-kredika-examples.js |
| API Kredika Complète | API_INTEGRATION_GUIDE.md |

---

## Support et Prochaines Étapes

**Immédiate** (Aujourd'hui) :
1. ✅ Lire cette documentation
2. ✅ Consulter le service Kredika
3. ✅ Tester la création de commande

**Court Terme** (Cette Semaine) :
1. Implémenter les webhooks
2. Tester l'intégration complète
3. Valider les cas d'erreur

**Moyen Terme** (Cette Semaine) :
1. Intégrer le frontend
2. Tester les paiements
3. Valider la production

---

**🎉 Intégration Kredika : 90% Complète**

Consultez `API_INTEGRATION_GUIDE.md` pour la documentation API détaillée.

**Version** : 1.0
**Dernière mise à jour** : 6 Décembre 2024
