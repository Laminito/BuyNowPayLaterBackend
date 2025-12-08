# 📦 Admin Product Management - Complete Guide

## ✅ Formulaire d'ajout de produit - OPÉRATIONNEL

La route admin pour créer des produits est maintenant **complètement opérationnelle**!

### 🔗 Endpoints

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/v1/admin/products` | Créer un nouveau produit |
| PUT | `/api/v1/admin/products/:id` | Mettre à jour un produit |
| DELETE | `/api/v1/admin/products/:id` | Supprimer un produit |

---

## 📋 Payloads JSON

### ✅ Payload MINIMAL (champs obligatoires)

```json
{
  "name": "Nouveau Canapé",
  "description": "Canapé confortable 3 places",
  "price": 285000,
  "category": "64b123f456789abc12345678",
  "sku": "CANAPE-NEW-001",
  "images": [
    {
      "url": "https://images.unsplash.com/photo-1628624998771-ed120a552e74?q=80&w=1170",
      "publicId": "canape-new-1",
      "alt": "Canapé 3 places"
    }
  ]
}
```

**Champs obligatoires:**
- `name` - Nom du produit
- `description` - Description détaillée
- `price` - Prix en centimes XOF
- `category` - ID MongoDB de la catégorie
- `sku` - Code unique du produit (ex: PROD-001)
- `images` - Au moins une image avec `url`, `publicId`, `alt`

---

### ✅ Payload COMPLET (tous les champs)

```json
{
  "name": "Salon Premium Gris et Or",
  "description": "Grand salon d'angle 7 places en tissu premium avec finitions dorées",
  "price": 520000,
  "originalPrice": 600000,
  "discount": 13,
  "category": "64b123f456789abc12345678",
  "sku": "SALON-PREMIUM-GREY-001",
  "images": [
    {
      "url": "https://images.unsplash.com/photo-1628624998771-ed120a552e74?q=80&w=1170&auto=format&fit=crop",
      "publicId": "salon-premium-1",
      "alt": "Salon premium vue générale"
    },
    {
      "url": "https://images.unsplash.com/photo-1673014200221-524696a1edd9?q=80&w=1231&auto=format&fit=crop",
      "publicId": "salon-premium-2",
      "alt": "Salon premium détail"
    }
  ],
  "video": {
    "url": "https://example.com/videos/salon-premium-video.mp4",
    "publicId": "salon-premium-video-1",
    "thumbnail": "https://example.com/thumbnails/salon-premium-video.jpg",
    "duration": 45,
    "fileSize": 15728640
  },
  "dimensions": {
    "length": 300,
    "width": 250,
    "height": 90,
    "weight": 180
  },
  "materials": [
    "Tissu premium",
    "Bois massif",
    "Pieds métal doré"
  ],
  "colors": [
    "Gris clair",
    "Or"
  ],
  "inStock": true,
  "stockQuantity": 5,
  "brand": "Luxury Living Premium",
  "tags": [
    "salon",
    "angle",
    "7 places",
    "premium"
  ],
  "featured": true,
  "isActive": true
}
```

**Tous les champs disponibles:**

| Champ | Type | Obligatoire | Notes |
|-------|------|-------------|-------|
| `name` | String | ✅ | Nom du produit |
| `description` | String | ✅ | Description détaillée |
| `price` | Number | ✅ | Prix en centimes |
| `originalPrice` | Number | ❌ | Prix avant remise (défaut = price) |
| `discount` | Number | ❌ | Pourcentage remise (0-100) |
| `category` | ObjectId | ✅ | ID de la catégorie |
| `sku` | String | ✅ | Code unique du produit |
| `images` | Array | ✅ | Au moins 1 image |
| `images[].url` | String | ✅ | URL de l'image |
| `images[].publicId` | String | ✅ | ID unique de l'image |
| `images[].alt` | String | ❌ | Texte alternatif |
| `video` | Object | ❌ | Infos vidéo |
| `video.url` | String | ❌ | URL de la vidéo |
| `video.publicId` | String | ❌ | ID de la vidéo |
| `video.thumbnail` | String | ❌ | Miniature vidéo |
| `video.duration` | Number | ❌ | Durée en secondes |
| `video.fileSize` | Number | ❌ | Taille en bytes |
| `dimensions` | Object | ❌ | Dimensions du produit |
| `dimensions.length` | Number | ❌ | Longueur en cm |
| `dimensions.width` | Number | ❌ | Largeur en cm |
| `dimensions.height` | Number | ❌ | Hauteur en cm |
| `dimensions.weight` | Number | ❌ | Poids en kg |
| `materials` | Array | ❌ | Matériaux [string] |
| `colors` | Array | ❌ | Couleurs disponibles [string] |
| `inStock` | Boolean | ❌ | En stock (défaut = true) |
| `stockQuantity` | Number | ❌ | Quantité en stock |
| `brand` | String | ❌ | Marque du produit |
| `tags` | Array | ❌ | Tags/labels [string] |
| `featured` | Boolean | ❌ | Produit en vedette (défaut = false) |
| `isActive` | Boolean | ❌ | Produit actif (défaut = true) |

---

## 🔐 Authentification Requise

Toutes les routes admin nécessitent:

```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

**Obtenir un JWT token:**

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@furniture-store.com",
    "password": "admin123"
  }'
```

---

## 📝 Exemples de Requêtes

### 1️⃣ Créer un produit (cURL)

```bash
curl -X POST http://localhost:3000/api/v1/admin/products \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Canapé Gris 3 Places",
    "description": "Canapé confortable en tissu gris",
    "price": 285000,
    "category": "64b123f456789abc12345678",
    "sku": "CANAPE-GRIS-001",
    "images": [
      {
        "url": "https://images.unsplash.com/photo-1628624998771-ed120a552e74?q=80&w=1170",
        "publicId": "canape-gris-1",
        "alt": "Canapé gris"
      }
    ],
    "inStock": true,
    "stockQuantity": 10,
    "brand": "Confort Home",
    "tags": ["canapé", "gris", "3 places"],
    "featured": false
  }'
```

### 2️⃣ Créer un produit (JavaScript/Fetch)

```javascript
const token = 'YOUR_JWT_TOKEN'; // Obtenu après login

const productData = {
  name: "Chambre Scandinave Blanc",
  description: "Ensemble chambre style scandinave en blanc",
  price: 380000,
  category: "64b123f456789abc12345678",
  sku: "CHAMBRE-SCANDI-001",
  images: [
    {
      url: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?q=80&w=1171",
      publicId: "chambre-scandi-1",
      alt: "Chambre scandinave"
    }
  ],
  dimensions: {
    length: 190,
    width: 140,
    height: 110,
    weight: 120
  },
  materials: ["Bois", "MDF"],
  colors: ["Blanc", "Bois clair"],
  inStock: true,
  stockQuantity: 8,
  brand: "Nordic Home",
  tags: ["scandinave", "blanc", "minimaliste"],
  featured: false
};

fetch('http://localhost:3000/api/v1/admin/products', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(productData)
})
.then(res => res.json())
.then(data => {
  if (data.success) {
    console.log('✅ Produit créé:', data.data);
  } else {
    console.error('❌ Erreur:', data.error);
  }
})
.catch(err => console.error('Erreur réseau:', err));
```

### 3️⃣ Mettre à jour un produit

```bash
curl -X PUT http://localhost:3000/api/v1/admin/products/64b123f456789abc12345678 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "price": 275000,
    "discount": 15,
    "stockQuantity": 5,
    "featured": true
  }'
```

### 4️⃣ Supprimer un produit

```bash
curl -X DELETE http://localhost:3000/api/v1/admin/products/64b123f456789abc12345678 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🖼️ Gestion des Images

### Option 1: URL (Recommandée)

```json
"images": [
  {
    "url": "https://images.unsplash.com/...",
    "publicId": "mon-image-1",
    "alt": "Description de l'image"
  }
]
```

**Avantages:**
- Pas de limite de taille
- Chargement rapide
- Images externes (Unsplash, Pexels, etc.)

### Option 2: Upload local (Bientôt)

À venir - Multipart form-data pour télécharger des fichiers locaux

---

## 📍 Obtenir les IDs des Catégories

```bash
curl -X GET http://localhost:3000/api/v1/categories \
  -H "Content-Type: application/json"
```

**Réponse exemple:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "64b123f456789abc12345678",
      "name": "Salons",
      "slug": "salons"
    },
    {
      "_id": "64b123f456789abc12345679",
      "name": "Chambres",
      "slug": "chambres"
    }
  ]
}
```

---

## ✅ Réponses du Serveur

### Succès (201 Created)

```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "_id": "64b123f456789abc12345680",
    "name": "Canapé Gris 3 Places",
    "price": 285000,
    "category": {
      "_id": "64b123f456789abc12345678",
      "name": "Salons",
      "slug": "salons"
    },
    "createdAt": "2025-12-07T10:30:00.000Z",
    "updatedAt": "2025-12-07T10:30:00.000Z"
  }
}
```

### Erreur (400 Bad Request)

```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "type": "field",
      "msg": "Product name is required",
      "path": "name",
      "location": "body"
    }
  ]
}
```

### Erreur (401 Unauthorized)

```json
{
  "success": false,
  "error": "Not authorized to access this route"
}
```

---

## 🧪 Test Rapide

### 1. Login pour obtenir le token

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@furniture-store.com",
    "password": "admin123"
  }'
```

Copie le `token` de la réponse.

### 2. Créer un produit

```bash
curl -X POST http://localhost:3000/api/v1/admin/products \
  -H "Authorization: Bearer TOKEN_COPIE_ICI" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Produit",
    "description": "Produit de test",
    "price": 100000,
    "category": "64b123f456789abc12345678",
    "sku": "TEST-001",
    "images": [{
      "url": "https://images.unsplash.com/photo-1628624998771-ed120a552e74",
      "publicId": "test-1",
      "alt": "Test"
    }]
  }'
```

---

## ⚠️ Règles de Validation

| Champ | Validation |
|-------|-----------|
| `name` | Obligatoire, max 255 caractères |
| `description` | Obligatoire |
| `price` | Obligatoire, >= 0 |
| `category` | Obligatoire, doit exister |
| `sku` | Obligatoire, unique dans la base |
| `images` | Au moins 1 image, URLs valides |
| `discount` | 0-100 |
| `stockQuantity` | >= 0 |

---

## 📱 Notes

✅ **Sécurité**: Authentification JWT requise + autorisation admin
✅ **Validation**: Tous les champs sont validés
✅ **Erreurs**: Messages clairs et détaillés
✅ **Images**: URL ou local (en développement)
✅ **Pagination**: Non nécessaire pour la création

---

## 🔄 Workflow Complet

1. **Login** → Obtenir le JWT token
2. **Obtenir catégories** → Récupérer les IDs disponibles
3. **Créer produit** → POST avec le payload
4. **Vérifier résultat** → Consulter les logs du serveur
5. **Tester produit** → GET /api/v1/products pour voir le produit créé

---

**Status: ✅ OPÉRATIONNEL**
