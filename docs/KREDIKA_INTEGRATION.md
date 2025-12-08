# Intégration Kredika - Configuration et Clés API

## 🎯 Philosophie Kredika

> **"Acheter maintenant, payer plus tard"**

Kredika democratise l'accès aux meubles et produits de qualité en offrant des solutions de crédit flexibles et sans intérêt.

### Mission
Rendre les achats aspirationnels accessibles à tous grâce à des plans de paiement simples, transparents et conviviaux.

### Valeurs Fondamentales
- ✅ **Accessibilité** - Pas d'intérêt, pas de frais cachés
- ✅ **Flexibilité** - Multiples méthodes de paiement (Wave, Orange Money, Banque, Espèces)
- ✅ **Transparence** - Calendriers d'échéances clairs et compréhensibles
- ✅ **Rapidité** - Approbation instantanée pour les clients éligibles
- ✅ **Inclusion** - Sert les populations non bancarisées en Afrique de l'Ouest

### Avantages pour les Clients
1. **Pas de frais d'intérêt** - Crédit entièrement gratuit
2. **Approbation rapide** - Décision en quelques minutes
3. **Paiements flexibles** - 3, 6, 12 ou 24 mois
4. **Paiements accessibles** - Montants mensuels abordables
5. **Transparence totale** - Tous les frais/conditions clairs dès le départ

### Avantages pour le Commerçant (Furniture Market)
1. **Augmentation du ticket moyen** - Les clients achètent plus via crédit
2. **Fidélisation** - Crédit au moment du besoin = client satisfait
3. **Gestion du risque** - Kredika gère la vérification d'identité et le risque
4. **Intégration simple** - API simple et webhooks fiables
5. **Support dédié** - Équipe Kredika pour les litiges et réclamations

## 🔐 Clés de Configuration Kredika

### Variables d'Environnement (.env)

```env
# Kredika Configuration
KREDIKA_API_URL=https://api.kredika.sn/api
KREDIKA_CLIENT_ID=pk_5d549668c41741f6
KREDIKA_CLIENT_SECRET=sk_live_a1b2c3d4e5f6g7h8i9j0
KREDIKA_API_KEY=kred_iAEh8HvzkSO9LeYG0yFlVvr3ya7
KREDIKA_PARTNER_KEY=pk_80b6af62e4ea45f6
KREDIKA_WEBHOOK_SECRET=whsec_kredika_webhook_secret
```

### Description des Clés

| Clé | Description | Usage |
|-----|-------------|-------|
| `KREDIKA_CLIENT_ID` | Identifiant client pour OAuth2 | Authentication API |
| `KREDIKA_CLIENT_SECRET` | Secret client pour OAuth2 | Authentication API |
| `KREDIKA_API_KEY` | Clé API pour requêtes directes | API requests |
| `KREDIKA_PARTNER_KEY` | Clé partenaire Furniture Market | Subscription & operations |
| `KREDIKA_WEBHOOK_SECRET` | Secret pour valider les webhooks | Webhook validation |

## 📦 Services Kredika Implémentés

### 1. **KredikaService** (`src/services/kredikaService.js`)
- Gestion de l'authentification (OAuth2)
- Création et gestion des réservations de crédit
- Traitement des webhooks
- Récupération des détails de paiement

### 2. **CreditController** (`src/controllers/creditController.js`)
Endpoints pour la gestion du crédit:

#### Profil de Crédit
- `GET /api/v1/credit/profile` - Récupérer le profil de crédit utilisateur
- `GET /api/v1/credit/orders` - Lister les commandes Kredika (avec pagination)
- `GET /api/v1/credit/orders/:orderId/installments` - Détails des échéances

#### Demandes de Crédit
- `POST /api/v1/credit/check-eligibility` - Vérifier l'éligibilité
- `POST /api/v1/credit/apply` - Soumettre une demande de crédit

#### Paiements
- `GET /api/v1/credit/payment-methods/:orderId` - Méthodes de paiement disponibles
- `POST /api/v1/credit/payment-confirmation` - Confirmer un paiement d'échéance

### 3. **Routes Kredika** (`src/routes/credit.js`)
Toutes les routes sont protégées avec le middleware `protect` (JWT required)

## 💳 Méthodes de Paiement Supportées

### 1. **Wave** 
- Numéro marchand: `+221771234567`
- Code USSD: `#144#`
- Frais: 1% (max 5000 XOF)

### 2. **Orange Money**
- Numéro marchand: `+221773456789`
- Code USSD: `#144#`
- Frais: Échelonnés (100 XOF pour < 5000, puis 1-1.5%)

### 3. **Virement Bancaire**
- Banque: Banque Atlantique Sénégal
- IBAN: `SN08SN0100152000098765432101234`
- Frais: 500 XOF fixes

### 4. **Paiement en Espèces**
- Points de paiement physiques (5 localités)
- Dakar, Thiès, Kaolack, Kolda

## 📊 Format des Données Kredika

### Réservation de Crédit
```json
{
  "creditReservationId": "res_xxx",
  "externalOrderRef": "ORD-1765190331460-19",
  "purchaseAmount": 450000,
  "installmentCount": 6,
  "monthlyPayment": 75000,
  "totalAmount": 450000,
  "interestAmount": 0,
  "status": "RESERVED",
  "installments": [
    {
      "installmentId": "inst_001",
      "dueDate": "2025-01-08",
      "amount": 75000,
      "status": "PENDING"
    }
  ]
}
```

### Statuts Kredika
- `RESERVED` - Crédit réservé, en attente de premier paiement
- `ACTIVE` - Crédit actif, paiements en cours
- `COMPLETED` - Tous les paiements effectués
- `CANCELLED` - Annulé
- `DEFAULTED` - Non-paiement/défaut

## 🔔 Webhooks Kredika

### Événements Gérés
- `reservation.created` - Nouvelle réservation créée
- `installment.due` - Échéance arrivant à terme
- `payment.received` - Paiement reçu
- `payment.overdue` - Paiement en retard
- `reservation.completed` - Crédit remboursé complètement

### Validation du Webhook
```javascript
// Route: POST /api/v1/webhooks/kredika
// Header requis: X-Kredika-Signature
// Validation: HMAC-SHA256 avec KREDIKA_WEBHOOK_SECRET
```

## 📈 Flux de Paiement Kredika

```
1. Utilisateur crée une commande (POST /api/v1/orders)
   ↓
2. Service Kredika crée une réservation
   ↓
3. Kredika retourne les détails de paiement et échéances
   ↓
4. Utilisateur reçoit les instructions (SMS/Email)
   ↓
5. Utilisateur paie via Wave/Orange/Banque/Cash
   ↓
6. Webhook confirme le paiement
   ↓
7. Statut de l'ordre mis à jour
```

## 🧪 Tests Disponibles

### Tester l'Éligibilité
```bash
curl -X POST http://localhost:3000/api/v1/credit/check-eligibility \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"purchaseAmount": 250000}'
```

### Consulter le Profil de Crédit
```bash
curl -X GET http://localhost:3000/api/v1/credit/profile \
  -H "Authorization: Bearer <token>"
```

### Récupérer les Commandes Kredika
```bash
curl -X GET "http://localhost:3000/api/v1/credit/orders?page=1&limit=10" \
  -H "Authorization: Bearer <token>"
```

## 🔍 Monitoring et Débogage

### Logs de Service Kredika
- Fichier: `src/services/kredikaService.js`
- Format: `[✅|❌] [ACTION] [DETAILS]`
- Exemple: `✅ Kredika authentication successful`

### Erreurs Courantes

| Erreur | Cause | Solution |
|--------|-------|----------|
| `ENOTFOUND api.kredika.sn` | API non accessible | Vérifier la connexion internet, l'URL de l'API |
| `getaddrinfo ENOTFOUND` | DNS non résolvable | Vérifier les paramètres KREDIKA_API_URL |
| `401 Unauthorized` | Clés invalides | Vérifier CLIENT_ID et CLIENT_SECRET |
| `Insufficient available credit` | Crédit insuffisant | Vérifier creditLimit et availableCredit de l'utilisateur |

## 📚 Documentation Swagger

Tous les endpoints sont documentés dans Swagger UI:

```
http://localhost:3000/api/docs
→ Credit Management section
```

## 🔄 Intégration Next.js Frontend

### Exemple de Hook React

```javascript
// hooks/useCredit.ts
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';

export function useCreditProfile() {
  return useQuery({
    queryKey: ['credit', 'profile'],
    queryFn: () => api.get('/credit/profile')
  });
}

export function useCheckEligibility() {
  return useMutation({
    mutationFn: (amount: number) =>
      api.post('/credit/check-eligibility', { purchaseAmount: amount })
  });
}

export function useApplyCredit() {
  return useMutation({
    mutationFn: (data) => api.post('/credit/apply', data)
  });
}
```

## ✅ Checklist de Déploiement

- [x] Clés Kredika ajoutées au `.env`
- [x] `.env` dans `.gitignore` (protection des clés)
- [x] Service Kredika implémenté
- [x] Controller de crédit complet
- [x] Routes de crédit avec authentification
- [x] Documentation Swagger complète
- [ ] Tests unitaires des endpoints
- [ ] Tests d'intégration avec Kredika
- [ ] Configuration CORS pour webhooks
- [ ] Monitoring en production
