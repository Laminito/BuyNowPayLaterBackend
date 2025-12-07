# 👥 API Utilisateurs - Documentation Complète

**Status**: ✅ Tous les endpoints implémentés

---

## 📋 Endpoints Disponibles

### 1. Récupérer le Profil Courant

**Endpoint** : `GET /api/users/profile/me`

**Headers** :
```
Authorization: Bearer {token}
```

**Response 200** :
```json
{
  "success": true,
  "data": {
    "_id": "67a3f8c9b4d5e6f7g8h9i0j1",
    "firstName": "Jean",
    "lastName": "Dupont",
    "email": "jean.dupont@test.com",
    "phone": "+221771111111",
    "address": "123 Rue de la Paix",
    "city": "Dakar",
    "postalCode": "18000",
    "country": "Senegal",
    "role": "user",
    "isActive": true,
    "isVerified": false,
    "favorites": [],
    "creditLimit": 1000,
    "availableCredit": 1000,
    "createdAt": "2024-12-06T20:45:00Z",
    "updatedAt": "2024-12-06T21:00:00Z"
  }
}
```

---

### 2. Mettre à Jour le Profil Courant

**Endpoint** : `PUT /api/users/profile`

**Headers** :
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body Request** :
```json
{
  "firstName": "Jean",
  "lastName": "Dupont",
  "phone": "+221771111111",
  "address": "123 Rue de la Paix",
  "city": "Dakar",
  "postalCode": "18000",
  "country": "Senegal"
}
```

**Response 200** :
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "_id": "67a3f8c9b4d5e6f7g8h9i0j1",
    "firstName": "Jean",
    "lastName": "Dupont",
    "phone": "+221771111111",
    "address": "123 Rue de la Paix",
    "city": "Dakar",
    "postalCode": "18000",
    "country": "Senegal",
    "updatedAt": "2024-12-06T21:00:00Z"
  }
}
```

---

## 👨‍💼 Endpoints Admin Seulement

### 3. Récupérer Tous les Utilisateurs

**Endpoint** : `GET /api/users`

**Headers** :
```
Authorization: Bearer {admin_token}
```

**Query Parameters** :
```
?page=1&limit=10&search=jean&role=user&isActive=true
```

**Response 200** :
```json
{
  "success": true,
  "data": [
    {
      "_id": "67a3f8c9b4d5e6f7g8h9i0j1",
      "firstName": "Jean",
      "lastName": "Dupont",
      "email": "jean.dupont@test.com",
      "phone": "+221771111111",
      "role": "user",
      "isActive": true,
      "createdAt": "2024-12-06T20:45:00Z"
    },
    {
      "_id": "67a3f8c9b4d5e6f7g8h9i0j2",
      "firstName": "Marie",
      "lastName": "Martin",
      "email": "marie.martin@test.com",
      "phone": "+221772222222",
      "role": "user",
      "isActive": true,
      "createdAt": "2024-12-06T20:46:00Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 46
  }
}
```

---

### 4. Récupérer un Utilisateur Spécifique

**Endpoint** : `GET /api/users/:id`

**Headers** :
```
Authorization: Bearer {admin_token}
```

**Response 200** :
```json
{
  "success": true,
  "data": {
    "_id": "67a3f8c9b4d5e6f7g8h9i0j1",
    "firstName": "Jean",
    "lastName": "Dupont",
    "email": "jean.dupont@test.com",
    "phone": "+221771111111",
    "address": "123 Rue de la Paix",
    "city": "Dakar",
    "postalCode": "18000",
    "country": "Senegal",
    "role": "user",
    "isActive": true,
    "isVerified": false,
    "favorites": [],
    "creditLimit": 1000,
    "availableCredit": 1000,
    "createdAt": "2024-12-06T20:45:00Z"
  }
}
```

---

### 5. Mettre à Jour le Statut d'un Utilisateur

**Endpoint** : `PUT /api/users/:id/status`

**Headers** :
```
Authorization: Bearer {admin_token}
Content-Type: application/json
```

**Body Request** :
```json
{
  "isActive": false
}
```

**Response 200** :
```json
{
  "success": true,
  "message": "User status updated successfully",
  "data": {
    "_id": "67a3f8c9b4d5e6f7g8h9i0j1",
    "firstName": "Jean",
    "lastName": "Dupont",
    "email": "jean.dupont@test.com",
    "isActive": false
  }
}
```

---

### 6. Supprimer un Utilisateur

**Endpoint** : `DELETE /api/users/:id`

**Headers** :
```
Authorization: Bearer {admin_token}
```

**Response 200** :
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

**Erreur** :
```json
// 404
{
  "message": "User not found"
}
```

---

## 🧪 Exemples de Requêtes

### cURL - Récupérer Profil Courant

```bash
curl -X GET http://localhost:3000/api/users/profile/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json"
```

### cURL - Mettre à Jour Profil

```bash
curl -X PUT http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jean",
    "lastName": "Dupont",
    "phone": "+221771111111"
  }'
```

### cURL - Récupérer Tous les Utilisateurs (Admin)

```bash
curl -X GET "http://localhost:3000/api/users?page=1&limit=10&search=jean" \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json"
```

### cURL - Récupérer Utilisateur Spécifique (Admin)

```bash
curl -X GET http://localhost:3000/api/users/67a3f8c9b4d5e6f7g8h9i0j1 \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json"
```

### cURL - Désactiver Utilisateur (Admin)

```bash
curl -X PUT http://localhost:3000/api/users/67a3f8c9b4d5e6f7g8h9i0j1/status \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json" \
  -d '{"isActive": false}'
```

### cURL - Supprimer Utilisateur (Admin)

```bash
curl -X DELETE http://localhost:3000/api/users/67a3f8c9b4d5e6f7g8h9i0j1 \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json"
```

---

## JavaScript/React - Exemples

### Récupérer Profil Courant

```javascript
import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:3000/api'
});

// Ajouter token
const token = localStorage.getItem('token');
API.defaults.headers.common['Authorization'] = `Bearer ${token}`;

// Récupérer profil
async function getProfile() {
  try {
    const res = await API.get('/users/profile/me');
    console.log('Profil:', res.data.data);
  } catch (err) {
    console.error('Erreur:', err.response?.data);
  }
}

getProfile();
```

### Mettre à Jour Profil

```javascript
async function updateProfile(updates) {
  try {
    const res = await API.put('/users/profile', updates);
    console.log('Profil mis à jour:', res.data.data);
    return res.data.data;
  } catch (err) {
    console.error('Erreur:', err.response?.data);
  }
}

updateProfile({
  firstName: 'Jean',
  lastName: 'Dupont',
  phone: '+221771111111'
});
```

### Récupérer Tous les Utilisateurs (Admin)

```javascript
async function getAllUsers(page = 1, search = '') {
  try {
    const res = await API.get('/users', {
      params: { page, limit: 10, search }
    });
    console.log('Utilisateurs:', res.data.data);
    console.log('Pagination:', res.data.pagination);
    return res.data;
  } catch (err) {
    console.error('Erreur:', err.response?.data);
  }
}

getAllUsers(1, 'jean');
```

### Hook React pour Profil

```javascript
import { useState, useEffect } from 'react';
import API from '../api/client';

export function useUserProfile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await API.get('/users/profile/me');
      setUser(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates) => {
    try {
      const res = await API.put('/users/profile', updates);
      setUser(res.data.data);
      return res.data.data;
    } catch (err) {
      setError(err.response?.data?.message);
      throw err;
    }
  };

  return { user, loading, error, updateProfile, refetch: fetchProfile };
}

// Utilisation dans un composant
function ProfilePage() {
  const { user, loading, updateProfile } = useUserProfile();

  if (loading) return <div>Chargement...</div>;

  return (
    <div>
      <h1>{user?.firstName} {user?.lastName}</h1>
      <p>Email: {user?.email}</p>
      <button onClick={() => updateProfile({ phone: '+221771111111' })}>
        Mettre à jour
      </button>
    </div>
  );
}
```

### Hook React pour Admin - Tous les Utilisateurs

```javascript
import { useState, useEffect } from 'react';
import API from '../api/client';

export function useUsers(page = 1, search = '') {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, [page, search]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await API.get('/users', {
        params: { page, limit: 10, search }
      });
      setUsers(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  const updateUserStatus = async (userId, isActive) => {
    try {
      const res = await API.put(`/users/${userId}/status`, { isActive });
      setUsers(users.map(u => u._id === userId ? res.data.data : u));
      return res.data.data;
    } catch (err) {
      setError(err.response?.data?.message);
      throw err;
    }
  };

  const deleteUser = async (userId) => {
    try {
      await API.delete(`/users/${userId}`);
      setUsers(users.filter(u => u._id !== userId));
    } catch (err) {
      setError(err.response?.data?.message);
      throw err;
    }
  };

  return { users, pagination, loading, error, updateUserStatus, deleteUser, refetch: fetchUsers };
}
```

---

## 🔑 Query Parameters

### Pour GET /api/users (Admin)

| Paramètre | Type | Description |
|-----------|------|-------------|
| `page` | Number | Numéro de page (défaut: 1) |
| `limit` | Number | Nombre d'items par page (défaut: 10) |
| `search` | String | Rechercher par firstName, lastName ou email |
| `role` | String | Filtrer par rôle (user, admin) |
| `isActive` | Boolean | Filtrer par statut actif (true/false) |

**Exemple** :
```
GET /api/users?page=2&limit=20&search=jean&role=user&isActive=true
```

---

## ✅ Checklist Frontend - Intégration Utilisateurs

- [ ] Page Profil - Afficher les infos utilisateur
- [ ] Page Profil - Permettre éditer le profil
- [ ] Page Profil - Afficher téléphone, adresse
- [ ] Page Admin - Lister tous les utilisateurs
- [ ] Page Admin - Rechercher utilisateurs
- [ ] Page Admin - Filtrer par rôle/statut
- [ ] Page Admin - Voir détails utilisateur
- [ ] Page Admin - Désactiver/Activer utilisateur
- [ ] Page Admin - Supprimer utilisateur
- [ ] Notifications d'erreur
- [ ] Spinner de chargement
- [ ] Confirmation avant suppression

---

## 📊 Comparaison Auth vs Users APIs

| Endpoint | Authentification | Utilisateurs |
|----------|-----------------|--------------|
| **Register** | `POST /auth/register` | Crée l'utilisateur |
| **Login** | `POST /auth/login` | Retourne token |
| **Get Profile** | `GET /auth/me` | Profil courant |
| **Get Profile (New)** | - | `GET /users/profile/me` ✅ |
| **Update Profile** | - | `PUT /users/profile` ✅ |
| **Get All Users** | - | `GET /users` (Admin) ✅ |
| **Get Single User** | - | `GET /users/:id` (Admin) ✅ |
| **Update Status** | - | `PUT /users/:id/status` (Admin) ✅ |
| **Delete User** | - | `DELETE /users/:id` (Admin) ✅ |

---

## 🚀 Status

✅ Tous les endpoints implémentés
✅ Authentification requise
✅ Contrôle d'accès (Admin-only)
✅ Pagination
✅ Recherche
✅ Filtres

Prêt à intégrer au frontend! 🎉

