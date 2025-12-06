# 🔌 Backend API Complète - Documentation pour Frontend React

**Version**: 1.0
**Date**: 6 Décembre 2025
**Intégration Kredika**: ✅ Complète

---

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Authentification](#authentification)
3. [Produits](#produits)
4. [Commandes](#commandes)
5. [Paiements & Kredika](#paiements--kredika)
6. [Utilisateurs](#utilisateurs)
7. [Avis & Commentaires](#avis--commentaires)
8. [Webhooks](#webhooks)
9. [Pages Frontend Requises](#pages-frontend-requises)
10. [Checklist d'Intégration Frontend](#checklist-dintégration-frontend)

---

## Vue d'ensemble

**Base URL** : `http://localhost:3000/api`

**Disponibilité** : 
- ✅ Swagger UI: `http://localhost:3000/api/docs`
- ✅ MongoDB: localhost:27017
- ✅ JWT Authentication: Bearer Token

**Status Serveur** :
```
🚀 Server running on port 3000
✅ MongoDB Connected: localhost
```

---

## Authentification

### 1. Inscription Utilisateur

**Endpoint** : `POST /auth/register`

**Body Request** :
```json
{
  "firstName": "Jean",
  "lastName": "Dupont",
  "email": "jean@example.com",
  "password": "SecurePassword123!",
  "phone": "+221771234567"
}
```

**Response 201** :
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "67a3f8c9b4d5e6f7g8h9i0j1",
    "firstName": "Jean",
    "lastName": "Dupont",
    "email": "jean@example.com",
    "phone": "+221771234567",
    "role": "user",
    "isActive": true,
    "createdAt": "2024-12-06T20:45:00Z"
  },
  "message": "User registered successfully"
}
```

**Erreurs** :
```json
// 400 - Email déjà existant
{
  "message": "Email already registered",
  "errors": [{"param": "email", "msg": "Email already in use"}]
}

// 400 - Mot de passe faible
{
  "message": "Validation failed",
  "errors": [{"param": "password", "msg": "Password must be at least 8 characters with uppercase, lowercase, number, and special character"}]
}
```

---

### 2. Connexion Utilisateur

**Endpoint** : `POST /auth/login`

**Body Request** :
```json
{
  "email": "jean@example.com",
  "password": "SecurePassword123!"
}
```

**Response 200** :
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "67a3f8c9b4d5e6f7g8h9i0j1",
    "firstName": "Jean",
    "lastName": "Dupont",
    "email": "jean@example.com",
    "phone": "+221771234567",
    "role": "user",
    "isActive": true,
    "createdAt": "2024-12-06T20:45:00Z"
  },
  "message": "Login successful"
}
```

**Erreurs** :
```json
// 401 - Identifiants invalides
{
  "message": "Invalid email or password"
}

// 400 - Utilisateur non actif
{
  "message": "Account is not active"
}
```

---

### 3. Récupérer Profil Utilisateur

**Endpoint** : `GET /auth/me`

**Headers** :
```
Authorization: Bearer {token}
```

**Response 200** :
```json
{
  "success": true,
  "user": {
    "_id": "67a3f8c9b4d5e6f7g8h9i0j1",
    "firstName": "Jean",
    "lastName": "Dupont",
    "email": "jean@example.com",
    "phone": "+221771234567",
    "role": "user",
    "isActive": true,
    "profilePicture": "https://...",
    "address": "123 Rue de la Paix, Dakar",
    "createdAt": "2024-12-06T20:45:00Z",
    "updatedAt": "2024-12-06T21:00:00Z"
  }
}
```

---

### 4. Mise à Jour Profil

**Endpoint** : `PUT /auth/profile`

**Headers** :
```
Authorization: Bearer {token}
```

**Body Request** :
```json
{
  "firstName": "Jean",
  "lastName": "Dupont",
  "phone": "+221771234567",
  "address": "123 Rue de la Paix, Dakar"
}
```

**Response 200** :
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": {
    "_id": "67a3f8c9b4d5e6f7g8h9i0j1",
    "firstName": "Jean",
    "lastName": "Dupont",
    "email": "jean@example.com",
    "phone": "+221771234567",
    "address": "123 Rue de la Paix, Dakar",
    "updatedAt": "2024-12-06T21:00:00Z"
  }
}
```

---

## Produits

### 1. Lister les Produits

**Endpoint** : `GET /products`

**Query Parameters** :
```
?page=1&limit=10&category=furniture&sort=-price&search=chaise
```

**Response 200** :
```json
{
  "success": true,
  "data": [
    {
      "_id": "69348fe02e6d1c21360ee592",
      "name": "Chaise de Salle à Manger",
      "description": "Confortable et élégante",
      "category": "furniture",
      "price": 45000,
      "discount": 10,
      "discountedPrice": 40500,
      "inStock": true,
      "stockQuantity": 15,
      "images": [
        {
          "url": "https://...",
          "alt": "Vue de face"
        },
        {
          "url": "https://...",
          "alt": "Vue de côté"
        }
      ],
      "specifications": {
        "material": "Bois massif",
        "color": "Marron",
        "dimensions": {
          "width": 45,
          "height": 85,
          "depth": 50
        }
      },
      "averageRating": 4.5,
      "reviewCount": 12,
      "createdAt": "2024-12-01T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 46,
    "page": 1,
    "pages": 5,
    "limit": 10
  }
}
```

---

### 2. Détails d'un Produit

**Endpoint** : `GET /products/:id`

**Response 200** :
```json
{
  "success": true,
  "data": {
    "_id": "69348fe02e6d1c21360ee592",
    "name": "Chaise de Salle à Manger",
    "description": "Confortable et élégante chaise de salle à manger",
    "category": "furniture",
    "price": 45000,
    "discount": 10,
    "discountedPrice": 40500,
    "inStock": true,
    "stockQuantity": 15,
    "images": [
      {
        "url": "https://...",
        "alt": "Vue de face"
      }
    ],
    "specifications": {
      "material": "Bois massif",
      "color": "Marron",
      "weight": 5,
      "dimensions": {
        "width": 45,
        "height": 85,
        "depth": 50
      }
    },
    "reviews": [
      {
        "_id": "5f7c9e8d7a6b5c4d3e2f1a0b",
        "userName": "Marie",
        "rating": 5,
        "comment": "Excellente qualité!",
        "createdAt": "2024-12-05T15:30:00Z"
      }
    ],
    "averageRating": 4.5,
    "reviewCount": 12
  }
}
```

---

## Commandes

### 1. Créer une Commande (Kredika)

**Endpoint** : `POST /orders`

**Headers** :
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body Request** :
```json
{
  "items": [
    {
      "productId": "69348fe02e6d1c21360ee592",
      "quantity": 2
    },
    {
      "productId": "69348fe02e6d1c21360ee593",
      "quantity": 1
    }
  ],
  "paymentMethod": "kredika",
  "installmentCount": 6,
  "shippingAddress": {
    "firstName": "Jean",
    "lastName": "Dupont",
    "street": "123 Rue de la Paix",
    "city": "Dakar",
    "postalCode": "18000",
    "country": "Senegal",
    "phone": "+221771234567"
  }
}
```

**Response 201** :
```json
{
  "success": true,
  "order": {
    "_id": "650c1234567890abcdef1234",
    "orderNumber": "ORD-1702894320000-1",
    "user": "67a3f8c9b4d5e6f7g8h9i0j1",
    "items": [
      {
        "product": "69348fe02e6d1c21360ee592",
        "quantity": 2,
        "price": 45000,
        "name": "Chaise de Salle à Manger",
        "image": "https://..."
      },
      {
        "product": "69348fe02e6d1c21360ee593",
        "quantity": 1,
        "price": 85000,
        "name": "Table à Manger",
        "image": "https://..."
      }
    ],
    "shippingAddress": {
      "firstName": "Jean",
      "lastName": "Dupont",
      "street": "123 Rue de la Paix",
      "city": "Dakar",
      "postalCode": "18000",
      "country": "Senegal",
      "phone": "+221771234567"
    },
    "pricing": {
      "subtotal": 175000,
      "shipping": 0,
      "tax": 52500,
      "total": 227500
    },
    "payment": {
      "method": "kredika",
      "status": "pending",
      "kredika": {
        "reservationId": "RES-123e4567-e89b-12d3-a456-426614174000",
        "externalOrderRef": "ORD-1702894320000-1",
        "externalCustomerRef": "CUST-67a3f8c9b4d5e6f7g8h9i0j1",
        "status": "RESERVED",
        "monthlyPayment": 37916,
        "installmentCount": 6,
        "installments": [
          {
            "installmentId": "INST-234e5678-f90c-23e4-b567-537725285111",
            "dueDate": "2024-12-15",
            "amount": 37916,
            "status": "PENDING"
          },
          {
            "installmentId": "INST-345e6789-g01d-34f5-c678-648836396222",
            "dueDate": "2025-01-15",
            "amount": 37916,
            "status": "PENDING"
          },
          {
            "installmentId": "INST-456f7890-h12e-45g6-d789-759947407333",
            "dueDate": "2025-02-15",
            "amount": 37916,
            "status": "PENDING"
          },
          {
            "installmentId": "INST-567g8901-i23f-56h7-e890-860a58b08444",
            "dueDate": "2025-03-15",
            "amount": 37916,
            "status": "PENDING"
          },
          {
            "installmentId": "INST-678h9012-j34g-67i8-f901-971b69c19555",
            "dueDate": "2025-04-15",
            "amount": 37916,
            "status": "PENDING"
          },
          {
            "installmentId": "INST-789i0123-k45h-78j9-g012-a82c7ad2a666",
            "dueDate": "2025-05-15",
            "amount": 37920,
            "status": "PENDING"
          }
        ],
        "paymentInstructions": {
          "wave": {
            "phone": "+221771234567",
            "code": "KREDIKA001"
          },
          "orangeMoney": {
            "phone": "+221771234567",
            "code": "KREDIKA002"
          },
          "bank": {
            "accountNumber": "12345678900",
            "bankName": "BICIS"
          }
        },
        "createdAt": "2024-12-06T20:45:20Z",
        "lastWebhookEvent": "reservation.created",
        "lastWebhookAt": "2024-12-06T20:45:20Z"
      }
    },
    "status": "pending",
    "createdAt": "2024-12-06T20:45:20Z",
    "updatedAt": "2024-12-06T20:45:20Z"
  },
  "kredika": {
    "reservationId": "RES-123e4567-e89b-12d3-a456-426614174000",
    "status": "RESERVED",
    "monthlyPayment": 37916,
    "installmentCount": 6,
    "installments": [
      {
        "installmentId": "INST-234e5678-f90c-23e4-b567-537725285111",
        "dueDate": "2024-12-15",
        "amount": 37916,
        "status": "PENDING"
      }
    ]
  },
  "message": "Order created successfully. Please complete payment via Kredika."
}
```

**Erreurs** :
```json
// 400 - Produit non disponible
{
  "message": "Product Chaise is not available"
}

// 400 - Stock insuffisant
{
  "message": "Insufficient stock for Table à Manger. Available: 5"
}

// 400 - Erreur Kredika
{
  "message": "Kredika payment reservation failed",
  "error": "Invalid API credentials"
}
```

---

### 2. Créer une Commande (Paiement Carte)

**Endpoint** : `POST /orders`

**Body Request** :
```json
{
  "items": [
    {
      "productId": "69348fe02e6d1c21360ee592",
      "quantity": 1
    }
  ],
  "paymentMethod": "card",
  "shippingAddress": {
    "firstName": "Jean",
    "lastName": "Dupont",
    "street": "123 Rue de la Paix",
    "city": "Dakar",
    "postalCode": "18000",
    "country": "Senegal"
  }
}
```

**Response 201** :
```json
{
  "success": true,
  "order": {
    "_id": "650c1234567890abcdef1235",
    "orderNumber": "ORD-1702894321000-2",
    "items": [...],
    "pricing": {
      "subtotal": 45000,
      "shipping": 0,
      "tax": 13500,
      "total": 58500
    },
    "payment": {
      "method": "card",
      "status": "pending"
    },
    "status": "pending"
  },
  "message": "Order created successfully"
}
```

---

### 3. Récupérer les Commandes de l'Utilisateur

**Endpoint** : `GET /orders`

**Headers** :
```
Authorization: Bearer {token}
```

**Query Parameters** :
```
?page=1&limit=10&status=pending
```

**Response 200** :
```json
{
  "success": true,
  "data": [
    {
      "_id": "650c1234567890abcdef1234",
      "orderNumber": "ORD-1702894320000-1",
      "items": [...],
      "pricing": {
        "subtotal": 175000,
        "shipping": 0,
        "tax": 52500,
        "total": 227500
      },
      "payment": {
        "method": "kredika",
        "status": "pending",
        "kredika": {
          "reservationId": "RES-123e4567-e89b-12d3-a456-426614174000",
          "status": "RESERVED",
          "monthlyPayment": 37916,
          "installmentCount": 6
        }
      },
      "status": "pending",
      "createdAt": "2024-12-06T20:45:20Z"
    }
  ],
  "pagination": {
    "total": 5,
    "page": 1,
    "pages": 1,
    "limit": 10
  }
}
```

---

### 4. Détails de la Commande avec Statut Kredika

**Endpoint** : `GET /orders/:id/kredika`

**Headers** :
```
Authorization: Bearer {token}
```

**Response 200** :
```json
{
  "success": true,
  "order": {
    "_id": "650c1234567890abcdef1234",
    "orderNumber": "ORD-1702894320000-1",
    "status": "confirmed",
    "payment": {
      "method": "kredika",
      "status": "pending",
      "kredika": {
        "reservationId": "RES-123e4567-e89b-12d3-a456-426614174000",
        "externalOrderRef": "ORD-1702894320000-1",
        "status": "ACTIVE",
        "monthlyPayment": 37916,
        "installmentCount": 6,
        "installments": [
          {
            "installmentId": "INST-234e5678-f90c-23e4-b567-537725285111",
            "dueDate": "2024-12-15",
            "amount": 37916,
            "status": "PAID",
            "paidAt": "2024-12-10T14:30:00Z"
          },
          {
            "installmentId": "INST-345e6789-g01d-34f5-c678-648836396222",
            "dueDate": "2025-01-15",
            "amount": 37916,
            "status": "PENDING"
          }
        ],
        "lastWebhookEvent": "installment.payment_received",
        "lastWebhookAt": "2024-12-10T14:30:00Z"
      }
    }
  },
  "kredika": {
    "reservationId": "RES-123e4567-e89b-12d3-a456-426614174000",
    "status": "ACTIVE",
    "monthlyPayment": 37916,
    "installmentCount": 6,
    "installments": [...]
  },
  "message": "Order synchronized from Kredika"
}
```

---

### 5. Annuler une Commande

**Endpoint** : `PUT /orders/:id/cancel`

**Headers** :
```
Authorization: Bearer {token}
```

**Response 200** :
```json
{
  "success": true,
  "message": "Order cancelled successfully",
  "order": {
    "_id": "650c1234567890abcdef1234",
    "status": "cancelled",
    "payment": {
      "status": "refunded"
    }
  }
}
```

---

## Paiements & Kredika

### 1. Récupérer les Options d'Échéances

**Endpoint** : `GET /orders/kredika/installments`

**Headers** :
```
Authorization: Bearer {token}
```

**Query Parameters** :
```
?amount=227500
```

**Response 200** :
```json
{
  "success": true,
  "data": {
    "amount": 227500,
    "options": [
      {
        "installments": 1,
        "monthlyPayment": 227500,
        "totalCost": 227500,
        "interestRate": 0
      },
      {
        "installments": 3,
        "monthlyPayment": 75833,
        "totalCost": 227500,
        "interestRate": 0
      },
      {
        "installments": 6,
        "monthlyPayment": 37916,
        "totalCost": 227500,
        "interestRate": 0
      },
      {
        "installments": 12,
        "monthlyPayment": 18958,
        "totalCost": 227500,
        "interestRate": 0
      }
    ]
  }
}
```

---

### 2. Synchroniser Statut Kredika

**Endpoint** : `GET /orders/:id/kredika`

**Réponse en cas de changement** :
```json
{
  "success": true,
  "kredika": {
    "reservationId": "RES-123...",
    "status": "ACTIVE",
    "installments": [
      {
        "installmentId": "INST-234...",
        "status": "PAID",
        "amount": 37916
      }
    ],
    "lastWebhookEvent": "installment.payment_received",
    "lastWebhookAt": "2024-12-10T14:30:00Z"
  },
  "message": "Order synchronized from Kredika"
}
```

---

## Utilisateurs

### 1. Récupérer Profil

**Endpoint** : `GET /auth/me`

**Response 200** :
```json
{
  "success": true,
  "user": {
    "_id": "67a3f8c9b4d5e6f7g8h9i0j1",
    "firstName": "Jean",
    "lastName": "Dupont",
    "email": "jean@example.com",
    "phone": "+221771234567",
    "role": "user",
    "profilePicture": "https://...",
    "address": "123 Rue de la Paix, Dakar",
    "createdAt": "2024-12-06T20:45:00Z"
  }
}
```

---

### 2. Mettre à Jour Profil

**Endpoint** : `PUT /auth/profile`

**Body Request** :
```json
{
  "firstName": "Jean",
  "lastName": "Dupont",
  "phone": "+221771234567",
  "address": "123 Rue de la Paix, Dakar"
}
```

**Response 200** :
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": {
    "_id": "67a3f8c9b4d5e6f7g8h9i0j1",
    "firstName": "Jean",
    "lastName": "Dupont",
    "phone": "+221771234567",
    "address": "123 Rue de la Paix, Dakar",
    "updatedAt": "2024-12-06T21:00:00Z"
  }
}
```

---

## Avis & Commentaires

### 1. Ajouter un Avis

**Endpoint** : `POST /products/:productId/reviews`

**Headers** :
```
Authorization: Bearer {token}
```

**Body Request** :
```json
{
  "rating": 5,
  "comment": "Excellente qualité, très satisfait!",
  "title": "Produit de qualité"
}
```

**Response 201** :
```json
{
  "success": true,
  "review": {
    "_id": "5f7c9e8d7a6b5c4d3e2f1a0b",
    "product": "69348fe02e6d1c21360ee592",
    "user": "67a3f8c9b4d5e6f7g8h9i0j1",
    "userName": "Jean D.",
    "rating": 5,
    "title": "Produit de qualité",
    "comment": "Excellente qualité, très satisfait!",
    "helpful": 0,
    "createdAt": "2024-12-06T21:00:00Z"
  },
  "message": "Review added successfully"
}
```

---

### 2. Récupérer les Avis d'un Produit

**Endpoint** : `GET /products/:productId/reviews`

**Query Parameters** :
```
?page=1&limit=5&sort=-rating
```

**Response 200** :
```json
{
  "success": true,
  "data": [
    {
      "_id": "5f7c9e8d7a6b5c4d3e2f1a0b",
      "userName": "Marie",
      "rating": 5,
      "title": "Excellente chaise",
      "comment": "Très confortable et durable",
      "helpful": 12,
      "createdAt": "2024-12-05T15:30:00Z"
    },
    {
      "_id": "5f7c9e8d7a6b5c4d3e2f1a0c",
      "userName": "Jean D.",
      "rating": 4,
      "title": "Bon rapport qualité-prix",
      "comment": "Bonne qualité pour le prix",
      "helpful": 8,
      "createdAt": "2024-12-04T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 12,
    "page": 1,
    "pages": 3,
    "limit": 5
  },
  "averageRating": 4.5,
  "reviewCount": 12
}
```

---

## Webhooks

### Types d'Événements Kredika

Les webhooks sont envoyés à votre backend lorsque :

**1. Paiement Reçu**
```json
{
  "event": "installment.payment_received",
  "data": {
    "installmentId": "INST-234e5678-f90c-23e4-b567-537725285111",
    "creditReservationId": "RES-123e4567-e89b-12d3-a456-426614174000",
    "amountPaid": 37916,
    "paymentDate": "2024-12-10"
  }
}
```

**2. Échéance en Retard**
```json
{
  "event": "installment.overdue",
  "data": {
    "installmentId": "INST-345e6789-g01d-34f5-c678-648836396222",
    "creditReservationId": "RES-123e4567-e89b-12d3-a456-426614174000",
    "daysOverdue": 5
  }
}
```

**3. Réservation Terminée**
```json
{
  "event": "reservation.completed",
  "data": {
    "creditReservationId": "RES-123e4567-e89b-12d3-a456-426614174000",
    "totalAmountPaid": 227500,
    "completionDate": "2025-05-15"
  }
}
```

---

## Pages Frontend Requises

### ✅ Pages Existantes à Intégrer

| Page | Status | Intégration Requise |
|------|--------|-------------------|
| **Accueil** | ✅ | Afficher produits avec API |
| **Produits** | ✅ | Intégrer pagination, filtres |
| **Détail Produit** | ✅ | Afficher avis, permettre ajouter avis |
| **Panier** | ⏳ | À créer |
| **Checkout** | ⏳ | À créer |
| **Profil** | ⏳ | À créer |
| **Mes Commandes** | ⏳ | À créer |
| **Détail Commande** | ⏳ | À créer |
| **Authentification** | ⏳ | À créer/Mettre à jour |

---

## Checklist d'Intégration Frontend

### Phase 1: Authentification ⏳

- [ ] Page Login (`/login`)
  - [ ] Formulaire email/password
  - [ ] Gestion des erreurs
  - [ ] Redirection après login
  - [ ] Stockage du token (localStorage/sessionStorage)

- [ ] Page Register (`/register`)
  - [ ] Formulaire complet (firstName, lastName, email, password, phone)
  - [ ] Validation password
  - [ ] Validation email
  - [ ] Termes et conditions

- [ ] Page Profil (`/profile`)
  - [ ] Afficher les infos utilisateur
  - [ ] Permettre mise à jour profil
  - [ ] Afficher photo profil

- [ ] Middleware d'Authentification
  - [ ] Vérifier token avant chaque requête
  - [ ] Rafraîchir token si expiré
  - [ ] Rediriger vers login si non authentifié

---

### Phase 2: Produits ⏳

- [ ] Page Produits (`/products`)
  - [ ] Afficher liste (API: `GET /products`)
  - [ ] Pagination (page, limit)
  - [ ] Filtres (category, price range, search)
  - [ ] Tri (price, rating, date)

- [ ] Page Détail Produit (`/products/:id`)
  - [ ] Afficher détails (API: `GET /products/:id`)
  - [ ] Afficher images
  - [ ] Afficher spécifications
  - [ ] Afficher avis (API: `GET /products/:id/reviews`)
  - [ ] Bouton "Ajouter au panier"

- [ ] Section Avis
  - [ ] Afficher avis avec rating
  - [ ] Permettre noter/commenter (API: `POST /products/:id/reviews`)
  - [ ] Pagination des avis

---

### Phase 3: Panier ⏳

- [ ] Page Panier (`/cart`)
  - [ ] Afficher items du panier
  - [ ] Permettre changer quantité
  - [ ] Permettre supprimer item
  - [ ] Afficher total + taxes
  - [ ] Bouton "Passer la commande"

- [ ] État Global (Context/Redux)
  - [ ] Gérer items du panier
  - [ ] Persister le panier (localStorage)
  - [ ] Afficher nombre items dans header

---

### Phase 4: Commandes ⏳

- [ ] Page Checkout (`/checkout`)
  - [ ] Afficher résumé panier
  - [ ] Formulaire adresse livraison
  - [ ] Choix méthode paiement
  - [ ] Pour Kredika: Afficher options d'échéances (API: `GET /orders/kredika/installments`)
  - [ ] Bouton "Confirmer la commande"

- [ ] Créer Commande
  - [ ] Appel API `POST /orders` avec les données
  - [ ] Gérer la réponse Kredika
  - [ ] Afficher confirmation
  - [ ] Rediriger vers page commande

- [ ] Page Mes Commandes (`/orders`)
  - [ ] Afficher toutes les commandes (API: `GET /orders`)
  - [ ] Afficher statut
  - [ ] Bouton "Voir détails"
  - [ ] Permettre annuler commande

- [ ] Page Détail Commande (`/orders/:id`)
  - [ ] Afficher détails (API: `GET /orders/:id/kredika`)
  - [ ] Afficher items
  - [ ] Afficher prix
  - [ ] **Pour Kredika** :
    - [ ] Afficher plan de paiement
    - [ ] Afficher instructions de paiement (Wave, Orange Money, Banque)
    - [ ] Afficher statut de chaque échéance
    - [ ] Permettre voir/télécharger facture

---

### Phase 5: Intégration Kredika ⏳

- [ ] Page Plan de Paiement
  - [ ] Afficher toutes les échéances
  - [ ] Afficher dates de paiement
  - [ ] Afficher montants
  - [ ] Afficher statut (PENDING, PAID, OVERDUE)

- [ ] Instructions de Paiement
  - [ ] Afficher les méthodes de paiement
  - [ ] Numéros de téléphone
  - [ ] Codes USSD
  - [ ] Comptes bancaires
  - [ ] Guide de paiement pour chaque méthode

- [ ] Suivi en Temps Réel
  - [ ] Synchroniser statut (appel API `GET /orders/:id/kredika`)
  - [ ] Afficher notifications de paiement reçu
  - [ ] Marquer échéance comme payée
  - [ ] Afficher progression (ex: 2/6 échéances payées)

- [ ] Webhooks Frontend
  - [ ] Polling toutes les 30 secondes pour commandes Kredika
  - [ ] Ou WebSocket pour notifications en temps réel
  - [ ] Afficher notifications toast

---

### Phase 6: Interface Utilisateur ⏳

- [ ] Header/Navigation
  - [ ] Menu produits
  - [ ] Lien panier (avec nombre items)
  - [ ] Menu utilisateur (Mon Profil, Mes Commandes, Logout)
  - [ ] Responsive mobile

- [ ] Footer
  - [ ] Liens utiles
  - [ ] Contact
  - [ ] Conditions d'utilisation
  - [ ] Politique de confidentialité

- [ ] Formulaires
  - [ ] Validation côté client
  - [ ] Messages d'erreur clairs
  - [ ] Indicateurs de chargement
  - [ ] Success/Error toasts

- [ ] Erreur & Loading
  - [ ] Afficher spinners pendant les requêtes
  - [ ] Gérer les erreurs API
  - [ ] Afficher messages d'erreur utilisateur
  - [ ] Page 404 & 500

---

## Configuration Frontend React

### 1. Installation des Dépendances

```bash
npm install axios react-router-dom zustand # ou redux
npm install react-hot-toast # pour notifications
npm install date-fns # pour dates
```

### 2. Configuration Base URL

```javascript
// src/api/client.js
import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Ajouter token à chaque requête
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;
```

### 3. Exemples de Hooks

```javascript
// src/hooks/useProducts.js
import { useState, useEffect } from 'react';
import API from '../api/client';

export function useProducts(page = 1, category = '') {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await API.get('/products', {
          params: { page, category, limit: 10 }
        });
        setProducts(res.data.data);
      } catch (err) {
        setError(err.response?.data?.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [page, category]);

  return { products, loading, error };
}
```

```javascript
// src/hooks/useAuth.js
import { useState } from 'react';
import API from '../api/client';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await API.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      return res.data;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return { user, login, logout, loading };
}
```

---

## État du Backend

| Composant | Status |
|-----------|--------|
| **Authentification** | ✅ Complète |
| **Produits** | ✅ Complète |
| **Commandes** | ✅ Complète |
| **Paiement Kredika** | ✅ Complète |
| **Avis & Commentaires** | ✅ Complète |
| **Webhooks Kredika** | ✅ Prêts (À intégrer) |
| **MongoDB** | ✅ Connecté |
| **Swagger Docs** | ✅ Disponible |

---

## Prochaines Étapes

### Frontend

1. **Urgent** : Créer pages authentification (Login/Register)
2. **Urgent** : Intégrer page produits et détail
3. **Important** : Créer panier et checkout
4. **Important** : Intégrer créer commande avec Kredika
5. **Important** : Afficher détails commande avec plan de paiement
6. **Standard** : Intégrer profil utilisateur
7. **Optimisation** : Ajouter caching et lazy loading

### Backend

1. **Optionnel** : Implémenter webhooks Kredika (routes/webhooks.js)
2. **Optionnel** : Ajouter email notifications
3. **Optionnel** : Ajouter analytics
4. **Optionnel** : Ajouter cron jobs pour rappels de paiement

---

## Support et Documentation

- 📚 **Swagger API** : `http://localhost:3000/api/docs`
- 📖 **API Kredika** : `API_INTEGRATION_GUIDE.md`
- 🔌 **Intégration Kredika** : `KREDIKA_INTEGRATION_COMPLETE.md`
- 🗺️ **Navigation Doc** : `DOCS_NAVIGATION.md`

---

**Document créé le 6 Décembre 2024**
**Pour intégration Frontend React**
**Version 1.0**
