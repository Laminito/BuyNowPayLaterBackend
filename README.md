# 🏪 Furniture Store Backend - Buy Now Pay Later

**Production-Ready E-Commerce API with BNPL Payments**

## 🚀 Fonctionnalités Principales

- **46 Produits** furniture seedés dans 4 catégories (Chambres, Salons, Cuisines, Bureaux)
- **Système de Paiement** Kredika (BNPL) + Carte + PayPal
- **8 Commandes Test** avec différents statuts (pending, confirmed, processing, shipped, delivered, cancelled)
- **15 Avis Seedés** avec modération, votes utiles, réponses admin
- **Authentification JWT** + bcrypt password hashing (cost 12)
- **API Versionnée** (/api/v1 principal, /api pour compatibilité)
- **Swagger UI** documentation complète
- **MongoDB** avec Mongoose ODM

## 🛠️ Stack Technique

| Composant | Technologie |
|-----------|------------|
| Runtime | Node.js 18+ |
| Framework | Express.js |
| Database | MongoDB (localhost:27017) |
| Auth | JWT + bcrypt |
| Payment | Kredika API |
| Storage | Cloudinary |
| Email | Nodemailer |
| Docs | Swagger/OpenAPI |

## 📦 Installation Rapide

```bash
# 1. Cloner et installer
git clone <repo>
cd BuyNowPayLaterBackend
npm install

# 2. Configurer l'environnement
cp .env.example .env

# 3. Démarrer
npm run dev              # Mode développement
npm run seed:all        # Seed la base de données
```

## 🎯 Endpoints Principaux

### Authentification
```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
GET    /api/v1/auth/me
```

### Produits
```
GET    /api/v1/products           # Liste (filtrable)
GET    /api/v1/products/:id       # Détail
POST   /api/v1/products           # Créer (admin)
PUT    /api/v1/products/:id       # Modifier (admin)
DELETE /api/v1/products/:id       # Supprimer (admin)
```

### Commandes
```
GET    /api/v1/orders             # Mes commandes
GET    /api/v1/orders/:id         # Détail
POST   /api/v1/orders             # Créer
PUT    /api/v1/orders/:id/cancel  # Annuler
```

### Avis
```
GET    /api/v1/reviews?productId=X    # Avis d'un produit
POST   /api/v1/reviews                # Créer (authentifié)
PUT    /api/v1/reviews/:id/helpful    # Vote utile
POST   /api/v1/reviews/:id/response   # Répondre (admin)
```

### Plus de détails
Documentation complète : `http://localhost:3000/api/docs`

## 🔐 Utilisateurs de Test

| Email | Mot de passe | Rôle |
|-------|------------|------|
| admin@furniture-store.com | admin123 | Admin |
| jean.dupont@email.com | password123 | User |
| marie.martin@email.com | password123 | User |
| pierre.bernard@email.com | password123 | User |
| sophie.laurent@email.com | password123 | User |
| marc.moreau@email.com | password123 | User |

## 📊 Données Seedées

- **Users**: 6 (1 admin + 5 clients)
- **Products**: 46 meubles (Prix: 45K-890K CFA)
- **Orders**: 8 commandes test
- **Reviews**: 15 avis (6 5⭐, 7 4⭐, 2 3⭐)
- **Categories**: 4 catégories

## ⚙️ Configuration (.env)

```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/buynowpaylater
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
JWT_COOKIE_EXPIRE=7

# Cloudinary
CLOUDINARY_NAME=your_name
CLOUDINARY_KEY=your_key
CLOUDINARY_SECRET=your_secret

# Kredika
KREDIKA_API_KEY=your_key
KREDIKA_MERCHANT_ID=your_merchant_id

# Email
EMAIL_FROM=noreply@furniture.com
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=465
SMTP_USER=your_user
SMTP_PASS=your_pass
```

## 🚀 Commandes NPM

```bash
npm start              # Production
npm run dev            # Développement (nodemon)
npm run seed:all       # Seed complet
npm run seed:database  # Produits + catégories
npm run seed:orders    # Commandes
npm run seed:reviews   # Avis
npm test              # Tests
npm run lint          # ESLint
```

## 📁 Structure du Projet

```
src/
├── controllers/     # Logique métier
├── models/         # Schémas MongoDB
├── routes/         # Endpoints API
├── middleware/     # Auth, validation
├── services/       # Kredika, etc.
└── app.js

scripts/
├── seedDatabase.js
├── seedOrders.js
├── seedReviews.js
└── cleanup.js
```

## 💳 Système de Paiement Kredika

- Limite de crédit : 500,000 CFA par utilisateur
- Paiements mensuels automatiques
- Intégration complète dans les commandes

## ⭐ Système d'Avis

- **Modération** : Pending → Approved/Rejected
- **Achat Vérifié** : Détection automatique
- **Votes Utiles** : Helpful/Unhelpful voting
- **Réponses Admin** : Admin responses capability
- **Rating Auto** : Mise à jour automatique du produit

## 🛡️ Sécurité

- ✅ Helmet (HTTP headers)
- ✅ CORS configuré
- ✅ Input validation (express-validator)
- ✅ Password hashing (bcrypt cost 12)
- ✅ JWT authentication
- ✅ Rate limiting
- ✅ Error handling sécurisé

## 📚 Modèles de Données

### User
- name, email (unique), password (bcrypted)
- role (user/admin), creditLimit (500K), availableCredit
- favorites array, lastLogin

### Product
- name, description, price, originalPrice, discount
- category, images (Cloudinary), dimensions, materials
- stockQuantity, rating (auto-updated)
- featured, isActive

### Order
- orderNumber, user, products[], totalAmount
- paymentMethod (kredika/card/paypal), orderStatus
- kredika {transactionId, installmentCount, monthlyPayment}
- shippingAddress {address, city, zip, country}

### Review
- product, user, title, comment, rating (1-5)
- helpful, unhelpful (counters)
- verified (auto-detected), status (pending/approved/rejected)
- responses[] (admin replies), images[]

## 🔧 Troubleshooting

**MongoDB pas connectée**
```
✓ Vérifier que MongoDB est lancé (mongod)
✓ Vérifier MONGODB_URI dans .env
```

**Token JWT invalide**
```
✓ Vérifier JWT_SECRET dans .env
✓ Vérifier que le token n'a pas expiré
```

**Erreur Kredika**
```
✓ Vérifier KREDIKA_API_KEY et MERCHANT_ID
✓ Vérifier la limite de crédit de l'utilisateur
```

## 📝 Notes

- Tous les mots de passe test utilisent bcrypt
- Images produits : Unsplash
- Avis auto-approuvés en seed (démo)
- API supporte /api/v1 et /api

## 🆘 Support

- **Swagger UI** : http://localhost:3000/api/docs
- **Server** : http://localhost:3000
- **MongoDB** : localhost:27017

---

**Version** : 1.0.0 | **Status** : Production Ready ✅ | **Date** : Décembre 2025