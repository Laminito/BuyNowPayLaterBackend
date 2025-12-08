# 🛋️ Furniture Market - Buy Now, Pay Later avec Kredika

**"Acheter maintenant, payer plus tard" - Rendre l'ameublement accessible à tous**

## 🚀 Qu'est-ce que c'est?

Furniture Market est une plateforme d'e-commerce d'ameublement qui intègre **Kredika**, un service de crédit sans intérêt permettant aux clients d'acheter maintenant et de payer en plusieurs mois.

## ⚡ Fonctionnalités Principales

### 🛍️ Catalogue de Meubles
- 46+ produits premium
- 4 catégories (Chambres, Salons, Cuisines, Bureaux)
- Descriptions détaillées, images, stock en temps réel

### 💳 Système de Crédit Kredika
- **Sans intérêt** - Crédit 100% gratuit
- **Flexible** - 3, 6, 12 ou 24 mois
- **Rapide** - Approbation instantanée
- **Transparent** - Pas de frais cachés

### 💰 Méthodes de Paiement
- 📱 **Wave** - Mobile money instantané
- 🟠 **Orange Money** - USSD simple
- 🏦 **Virement Bancaire** - SN officiel
- 💵 **Paiement en Espèces** - 5 showrooms physiques

### 👤 Profil Client
- Gestion de profil complet
- Historique de commandes
- Suivi des paiements Kredika
- Favoris et wishlist

## 🔧 Stack Technique

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Base de données**: MongoDB (Mongoose)
- **Authentification**: JWT
- **Email**: Nodemailer + Gmail SMTP
- **API Kredika**: Intégration complète avec webhooks

### Documentation
- **Swagger/OpenAPI 3.0** - Documentation interactive
- **JSDoc** - Commentaires détaillés du code
- **Markdown** - Guides et tutoriels

## 📦 Installation

### Prérequis
- Node.js 14+
- MongoDB local ou Atlas
- Clés Kredika API

### Installation Locale

```bash
# Cloner le repo
git clone <repo-url>
cd BuyNowPayLaterBackend

# Installer les dépendances
npm install

# Configuration
cp .env.example .env
# Éditer .env avec vos clés

# Démarrer le serveur
npm start

# Accéder à l'API
http://localhost:3000/api/docs
```

## 📚 Endpoints API

### Authentification
```bash
POST   /api/v1/auth/register              # Créer un compte
POST   /api/v1/auth/login                 # Se connecter
POST   /api/v1/auth/password-reset        # Réinitialiser mot de passe
GET    /api/v1/auth/me                    # Mon profil
```

### Produits
```bash
GET    /api/v1/products                   # Lister les meubles
GET    /api/v1/products/:id               # Détail d'un meuble
GET    /api/v1/products?category=salons   # Filtrer par catégorie
```

### Commandes
```bash
POST   /api/v1/orders                     # Créer une commande
GET    /api/v1/orders                     # Mes commandes
GET    /api/v1/orders/:id                 # Détail de la commande
```

### Gestion du Crédit Kredika
```bash
GET    /api/v1/credit/profile             # Mon profil de crédit
GET    /api/v1/credit/orders              # Mes commandes en crédit
GET    /api/v1/credit/orders/:id/installments  # Mes échéances
POST   /api/v1/credit/check-eligibility   # Suis-je éligible?
POST   /api/v1/credit/apply               # Demander un crédit
GET    /api/v1/credit/payment-methods/:id # Méthodes de paiement
POST   /api/v1/credit/payment-confirmation # Confirmer paiement
```

### Categories & Types
```bash
GET    /api/v1/categories                 # Liste des catégories
GET    /api/v1/product-types              # Types de produits
POST   /api/v1/product-types/generate-sku # Générer SKU automatiquement
```

## 🔐 Configuration Kredika

### Variables d'Environnement
```env
KREDIKA_API_URL=https://api.kredika.sn/api
KREDIKA_CLIENT_ID=pk_5d549668c41741f6
KREDIKA_CLIENT_SECRET=sk_live_a1b2c3d4e5f6g7h8i9j0
KREDIKA_API_KEY=kred_iAEh8HvzkSO9LeYG0yFlVvr3ya7
KREDIKA_PARTNER_KEY=pk_80b6af62e4ea45f6
KREDIKA_WEBHOOK_SECRET=whsec_kredika_webhook_secret
```

### Webhooks Kredika
```
POST /api/v1/webhooks/kredika
```

Événements gérés:
- `reservation.created` - Nouvelle réservation
- `installment.due` - Échéance arrivant
- `payment.received` - Paiement reçu
- `payment.overdue` - Paiement en retard
- `reservation.completed` - Crédit remboursé

## 👥 Utilisateurs de Test

### Admin
```
Email: admin@furniture-store.com
Password: admin123
Role: admin
```

### Clients
```
jean.dupont@email.com      / password123
marie.martin@email.com     / password123
pierre.bernard@email.com   / password123
sophie.laurent@email.com   / password123
marc.moreau@email.com      / password123
```

## 📊 Données Seeded

### Produits: 46 items
- **Chambres**: 12 produits
- **Salons**: 15 produits
- **Cuisines**: 11 produits
- **Bureaux**: 8 produits

### Types de Produits: 5
- LIT (Lits)
- CANAPE (Canapés)
- TABLE (Tables)
- ARMOIRE (Armoires)
- ACC (Accessoires)

### Catégories: 4
- Chambres
- Salons
- Cuisines
- Bureaux

### Commandes: 7 samples
### Avis: 15 reviews
### Utilisateurs: 6 (1 admin + 5 clients)

## 🧪 Tests

### Vérifier l'éligibilité
```bash
curl -X POST http://localhost:3000/api/v1/credit/check-eligibility \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"purchaseAmount": 250000}'
```

### Consulter le profil de crédit
```bash
curl -X GET http://localhost:3000/api/v1/credit/profile \
  -H "Authorization: Bearer <token>"
```

### Créer une commande avec Kredika
```bash
curl -X POST http://localhost:3000/api/v1/orders \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"productId": "...", "quantity": 1}],
    "shippingAddress": {...},
    "paymentMethod": "kredika"
  }'
```

## 📖 Documentation

- 📄 **KREDIKA_PHILOSOPHY.md** - Vision et mission
- 📄 **KREDIKA_INTEGRATION.md** - Guide technique complet
- 📄 **kredika-subscription-payload.json** - Config Furniture Market chez Kredika
- 🔗 **Swagger UI** - http://localhost:3000/api/docs

## 🛠️ Architecture

```
BuyNowPayLaterBackend/
├── src/
│   ├── models/               # Schémas MongoDB
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Order.js
│   │   ├── Category.js
│   │   └── ProductType.js
│   ├── controllers/          # Logique métier
│   │   ├── auth.js
│   │   ├── products.js
│   │   ├── orders.js
│   │   ├── creditController.js   # ← KREDIKA
│   │   ├── categories.js
│   │   └── productTypes.js
│   ├── routes/              # Endpoints
│   │   ├── auth.js
│   │   ├── products.js
│   │   ├── orders.js
│   │   ├── credit.js             # ← KREDIKA
│   │   ├── categories.js
│   │   └── productTypes.js
│   ├── services/            # Services externes
│   │   ├── kredikaService.js     # ← KREDIKA API
│   │   └── emailService.js
│   ├── middleware/          # Middlewares
│   │   ├── auth.js
│   │   └── errorHandler.js
│   ├── config/              # Configuration
│   │   └── database.js
│   ├── swagger.js           # Documentation Swagger
│   ├── swagger-credit.js    # Docs Kredika ← KREDIKA
│   └── app.js              # Application Express
├── docs/
│   ├── KREDIKA_PHILOSOPHY.md    # ← KREDIKA
│   ├── KREDIKA_INTEGRATION.md   # ← KREDIKA
│   └── kredika-subscription-payload.json  # ← KREDIKA
├── scripts/
│   ├── seedDatabase.js      # Seed produits
│   ├── seedOrders.js        # Seed commandes
│   └── seedReviews.js       # Seed avis
├── .env                     # Secrets (Kredika keys)
└── package.json
```

## 🎯 Roadmap

### V1.0 ✅ (Actuel)
- [x] Intégration Kredika complète
- [x] Endpoints de crédit
- [x] Webhooks Kredika
- [x] Documentation complète
- [x] Support 4 méthodes de paiement

### V1.1 🔄 (Prochainement)
- [ ] App mobile (React Native)
- [ ] Notifications SMS pour les échéances
- [ ] Dashboard admin pour Kredika
- [ ] Rapports d'utilisation

### V2.0 📅 (2026)
- [ ] Expansion à 5+ pays West Africa
- [ ] Partenariat avec autres e-commerçants
- [ ] Service de crédit propriétaire
- [ ] Showrooms physiques

## 🤝 Support

Pour les questions ou bugs:
- 📧 Email: contact@furnituremarket.sn
- 💬 Chat: support.furnituremarket.sn
- 📞 Téléphone: +221 33 876 5432

## 📄 License

Propriétaire - Furniture Market 2024

---

**Furniture Market + Kredika = Rêves réalisés, meubles livrés, paiements flexibles.**

*"Acheter maintenant, payer plus tard."*
