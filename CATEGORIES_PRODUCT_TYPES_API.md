# 📚 API Documentation - Categories & Product Types

## Categories API - CRUD Complet

### 1. GET - Récupérer toutes les catégories

**Endpoint:** `GET /api/v1/categories`
**Accès:** Public

**Paramètres de query:**
- `isActive` (optional): `true` ou `false` - Filtrer par statut

**Réponse (200):**
```json
{
  "success": true,
  "count": 4,
  "data": [
    {
      "_id": "64b123f456789abc12345678",
      "name": "Chambres",
      "slug": "chambres",
      "description": "Lits, armoires, commodes pour votre chambre",
      "sortOrder": 1,
      "isActive": true,
      "parent": null,
      "createdAt": "2025-12-07T10:30:00.000Z",
      "updatedAt": "2025-12-07T10:30:00.000Z"
    }
  ]
}
```

---

### 2. GET - Récupérer une catégorie par ID

**Endpoint:** `GET /api/v1/categories/:id`
**Accès:** Public

**Exemple:**
```bash
curl http://localhost:3000/api/v1/categories/64b123f456789abc12345678
```

**Réponse (200):**
```json
{
  "success": true,
  "data": {
    "_id": "64b123f456789abc12345678",
    "name": "Chambres",
    "slug": "chambres",
    "description": "Lits, armoires, commodes pour votre chambre",
    "sortOrder": 1,
    "isActive": true,
    "parent": null
  }
}
```

---

### 3. GET - Récupérer une catégorie par slug

**Endpoint:** `GET /api/v1/categories/slug/:slug`
**Accès:** Public

**Exemple:**
```bash
curl http://localhost:3000/api/v1/categories/slug/chambres
```

---

### 4. POST - Créer une nouvelle catégorie

**Endpoint:** `POST /api/v1/admin/categories`
**Accès:** Private/Admin
**Header:** `Authorization: Bearer {JWT_TOKEN}`

**Body:**
```json
{
  "name": "Nouveaux Meubles",
  "slug": "nouveaux-meubles",
  "description": "Nouvelle collection de meubles",
  "sortOrder": 5,
  "parent": null,
  "image": {
    "url": "https://example.com/image.jpg",
    "publicId": "cat-image-1"
  }
}
```

**Réponse (201):**
```json
{
  "success": true,
  "message": "Category created successfully",
  "data": {
    "_id": "64b123f456789abc12345680",
    "name": "Nouveaux Meubles",
    "slug": "nouveaux-meubles",
    "description": "Nouvelle collection de meubles",
    "sortOrder": 5,
    "isActive": true,
    "parent": null
  }
}
```

---

### 5. PUT - Mettre à jour une catégorie

**Endpoint:** `PUT /api/v1/admin/categories/:id`
**Accès:** Private/Admin

**Body (tous les champs optionnels):**
```json
{
  "name": "Chambres Modernes",
  "description": "Nouvelles chambres modernes",
  "sortOrder": 2,
  "isActive": true
}
```

**Réponse (200):**
```json
{
  "success": true,
  "message": "Category updated successfully",
  "data": { ... }
}
```

---

### 6. DELETE - Supprimer une catégorie

**Endpoint:** `DELETE /api/v1/admin/categories/:id`
**Accès:** Private/Admin

**Exemple:**
```bash
curl -X DELETE \
  http://localhost:3000/api/v1/admin/categories/64b123f456789abc12345680 \
  -H "Authorization: Bearer {JWT_TOKEN}"
```

**Réponse (200):**
```json
{
  "success": true,
  "message": "Category deleted successfully",
  "data": { ... }
}
```

---

## Product Types API - CRUD Complet

### 1. GET - Récupérer tous les types de produits

**Endpoint:** `GET /api/v1/product-types`
**Accès:** Public

**Réponse (200):**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "_id": "64b456f789abc12345678def",
      "name": "Lit",
      "code": "LIT",
      "description": "Lits et sommiers",
      "attributes": [
        {
          "name": "Taille",
          "type": "select",
          "required": true,
          "options": ["Simple", "Double", "Queen", "King"]
        },
        {
          "name": "Matériau",
          "type": "select",
          "required": true,
          "options": ["Bois", "Métal", "Tissu"]
        }
      ],
      "isActive": true,
      "createdAt": "2025-12-07T10:30:00.000Z"
    }
  ]
}
```

---

### 2. GET - Récupérer un type par ID

**Endpoint:** `GET /api/v1/product-types/:id`
**Accès:** Public

---

### 3. GET - Récupérer un type par code

**Endpoint:** `GET /api/v1/product-types/code/:code`
**Accès:** Public

**Exemple:**
```bash
curl http://localhost:3000/api/v1/product-types/code/LIT
```

---

### 4. POST - Créer un type de produit

**Endpoint:** `POST /api/v1/product-types`
**Accès:** Private/Admin

**Body:**
```json
{
  "name": "Chaise",
  "code": "CHAISE",
  "description": "Chaises de salle à manger et de bureau",
  "attributes": [
    {
      "name": "Style",
      "type": "select",
      "required": true,
      "options": ["Moderne", "Classique", "Scandinave", "Industriel"]
    },
    {
      "name": "Hauteur assise",
      "type": "number",
      "required": false
    },
    {
      "name": "Revêtement",
      "type": "select",
      "required": true,
      "options": ["Tissu", "Cuir", "Bois", "Plastique"]
    }
  ]
}
```

**Réponse (201):**
```json
{
  "success": true,
  "message": "Product type created successfully",
  "data": { ... }
}
```

---

### 5. PUT - Mettre à jour un type

**Endpoint:** `PUT /api/v1/product-types/:id`
**Accès:** Private/Admin

**Body:**
```json
{
  "description": "Description mise à jour",
  "isActive": false
}
```

---

### 6. DELETE - Supprimer un type

**Endpoint:** `DELETE /api/v1/product-types/:id`
**Accès:** Private/Admin

---

## SKU Generator API

### Générer un SKU automatique

**Endpoint:** `POST /api/v1/generate-sku`
**Accès:** Private/Admin

**Body:**
```json
{
  "productTypeCode": "LIT",
  "categorySlug": "chambres",
  "variant": "double-bois"
}
```

**Réponse (200):**
```json
{
  "success": true,
  "message": "SKU generated successfully",
  "data": {
    "sku": "LIT-CHAMBRES-DOUBLE-BOIS-2847",
    "productType": "Lit",
    "category": "chambres",
    "variant": "double-bois"
  }
}
```

**Format du SKU:** `{TYPE_CODE}-{CATEGORY}-{VARIANT}-{TIMESTAMP}`

---

## Frontend Form Integration

### Exemple: Form de création de produit avec listes déroulantes

```javascript
// Récupérer les catégories
async function loadCategories() {
  const response = await fetch('http://localhost:3000/api/v1/categories');
  const { data } = await response.json();
  return data;
}

// Récupérer les types de produits
async function loadProductTypes() {
  const response = await fetch('http://localhost:3000/api/v1/product-types');
  const { data } = await response.json();
  return data;
}

// Générer SKU automatiquement
async function generateSKU(productTypeCode, categorySlug, variant) {
  const response = await fetch('http://localhost:3000/api/v1/generate-sku', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      productTypeCode,
      categorySlug,
      variant
    })
  });
  
  const { data } = await response.json();
  return data.sku;
}
```

---

## Validations

### Catégories
- `name`: Obligatoire, max 100 caractères
- `slug`: Optionnel, lettres minuscules + tirets + chiffres
- `sortOrder`: Nombre positif (par défaut: 0)
- `parent`: ID MongoDB valide (optionnel)

### Types de Produits
- `name`: Obligatoire
- `code`: Obligatoire, 2-10 caractères (majuscules, chiffres, tirets)
- `attributes`: Array d'objets avec name, type, required, options

---

## Erreurs Courantes

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Not authorized to access this route"
}
```
**Solution:** Ajouter le JWT token dans le header Authorization

### 400 Bad Request
```json
{
  "success": false,
  "error": "Category with this name already exists"
}
```
**Solution:** Changer le nom ou vérifier les champs obligatoires

### 404 Not Found
```json
{
  "success": false,
  "error": "Category not found"
}
```
**Solution:** Vérifier l'ID fourni

---

## Notes Importantes

✅ Toutes les routes admin requièrent authentification (JWT token)
✅ Les catégories supportent la hiérarchie (parent/enfant)
✅ Les SKU sont générés automatiquement avec timestamp
✅ Les types de produits peuvent avoir des attributs personnalisés
✅ Slug est généré automatiquement si non fourni (conversion du name)

