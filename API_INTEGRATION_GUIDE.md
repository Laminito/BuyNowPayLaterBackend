# Guide d'Intégration API Kredika Core

## Table des matières

1. [Introduction](#introduction)
2. [Environnement & Configuration](#environnement--configuration)
3. [Authentification](#authentification)
4. [Gestion des Réservations de Crédit](#gestion-des-réservations-de-crédit)
5. [Gestion des Échéances](#gestion-des-échéances)
6. [Instructions de Paiement](#instructions-de-paiement)
7. [Codes d'Erreur](#codes-derreur)
8. [Bonnes Pratiques](#bonnes-pratiques)
9. [Support](#support)

---

## Introduction

**Kredika Core** est une plateforme Credit-as-a-Service (CaaS) pour l'Afrique de l'Ouest qui fournit une infrastructure API pour les solutions de crédit intégré et Buy Now Pay Later (BNPL).

### Caractéristiques principales

- API RESTful avec authentification par token
- Support multi-partenaires avec isolation complète des données
- Calcul automatique des échéances de paiement
- Instructions de paiement multilingues (FR, WO, EN)
- Support multi-canaux (Wave, Orange Money, Free Money, Banque, Cash)
- Aucune donnée personnelle identifiable (PII) stockée

### URL de Base

```
Production: https://api.kredika.sn/api
Staging: https://staging-api.kredika.sn/api
Local: http://localhost:7575/api
```

### Format des Réponses

Toutes les réponses sont au format JSON. Les timestamps sont en ISO 8601.

---

## Environnement & Configuration

### Prérequis

- **HTTPS requis** : Toutes les requêtes API doivent utiliser HTTPS en production
- **Content-Type** : `application/json`
- **Accept** : `application/json`
- **Encodage** : UTF-8

### Rate Limiting

- **Limite par défaut** : 1000 requêtes/heure par partenaire
- **Limite burst** : 50 requêtes/minute
- En cas de dépassement, vous recevrez un code `429 Too Many Requests`

### Headers Requis

```http
Content-Type: application/json
Accept: application/json
Authorization: Bearer {access_token}
```

---

## Authentification

Kredika utilise un système d'authentification par token OAuth 2.0-like pour les partenaires.

### 1. Obtenir un Access Token

**Endpoint** : `POST /v1/auth/token`

**Description** : Authentifie un partenaire et retourne un access token (24h) et un refresh token (30 jours).

#### Requête

```http
POST /v1/auth/token
Content-Type: application/json

{
  "clientId": "pk_5d549668c41741f6",
  "clientSecret": "sk_live_a1b2c3d4e5f6g7h8i9j0"
}
```

#### Réponse (200 OK)

```json
{
  "success": true,
  "accessToken": "tok_e8f7d6c5b4a39281",
  "refreshToken": "rtok_1a2b3c4d5e6f7g8h",
  "tokenType": "Bearer",
  "expiresIn": 86400,
  "scope": "partner_api",
  "partnerId": "pk_5d549668c41741f6",
  "partnerName": "Orange Money Senegal",
  "issuedAt": "2024-11-15T10:30:00Z"
}
```

#### Erreurs Possibles

```json
// 401 Unauthorized - Identifiants invalides
{
  "success": false,
  "message": "Invalid client credentials",
  "issuedAt": "2024-11-15T10:30:00Z"
}

// 400 Bad Request - Requête invalide
{
  "success": false,
  "message": "clientId and clientSecret are required",
  "issuedAt": "2024-11-15T10:30:00Z"
}
```

### 2. Renouveler un Access Token

**Endpoint** : `POST /v1/auth/refresh`

**Description** : Utilise un refresh token pour obtenir une nouvelle paire de tokens.

#### Requête

```http
POST /v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "rtok_1a2b3c4d5e6f7g8h"
}
```

#### Réponse (200 OK)

```json
{
  "success": true,
  "accessToken": "tok_f9e8d7c6b5a43210",
  "refreshToken": "rtok_2b3c4d5e6f7g8h9i",
  "tokenType": "Bearer",
  "expiresIn": 86400,
  "scope": "partner_api",
  "partnerId": "pk_5d549668c41741f6",
  "partnerName": "Orange Money Senegal",
  "issuedAt": "2024-11-15T11:30:00Z"
}
```

### 3. Valider un Access Token

**Endpoint** : `POST /v1/auth/validate`

**Description** : Vérifie qu'un access token est valide.

#### Requête

```http
POST /v1/auth/validate
Authorization: Bearer tok_e8f7d6c5b4a39281
```

#### Réponse (200 OK)

```json
{
  "success": true,
  "accessToken": "tok_e8f7d6c5b4a39281",
  "tokenType": "Bearer",
  "expiresIn": 86400,
  "scope": "partner_api",
  "partnerId": "pk_5d549668c41741f6",
  "partnerName": "Orange Money Senegal",
  "issuedAt": "2024-11-15T10:30:00Z"
}
```

### 4. Révoquer un Token

**Endpoint** : `POST /v1/auth/revoke`

#### Requête

```http
POST /v1/auth/revoke
Authorization: Bearer tok_e8f7d6c5b4a39281
```

#### Réponse (200 OK)

```json
{
  "success": true,
  "message": "Token révoqué avec succès",
  "issuedAt": "2024-11-15T12:00:00Z"
}
```

### 5. Révoquer Tous les Tokens

**Endpoint** : `POST /v1/auth/revoke-all`

**Description** : Révoque tous les tokens d'un partenaire (cas de compromission de sécurité).

#### Requête

```http
POST /v1/auth/revoke-all
Authorization: Bearer tok_e8f7d6c5b4a39281
```

#### Réponse (200 OK)

```json
{
  "success": true,
  "message": "Tous les tokens ont été révoqués avec succès",
  "issuedAt": "2024-11-15T12:05:00Z"
}
```

---

## Gestion des Réservations de Crédit

### 1. Créer une Réservation de Crédit

**Endpoint** : `POST /v1/credits/reservations`

**Description** : Crée une nouvelle réservation de crédit avec calcul automatique des échéances.

#### Requête

```http
POST /v1/credits/reservations
Authorization: Bearer tok_e8f7d6c5b4a39281
Content-Type: application/json

{
  "partnerId": "pk_5d549668c41741f6",
  "externalOrderRef": "CMD_ORANGE_001",
  "externalCustomerRef": "CUST_12345",
  "purchaseAmount": 250000.00,
  "installmentCount": 6,
  "notes": "Achat smartphone Samsung Galaxy A54",
  "totalActiveCredits": 0
}
```

**Champs** :
- `partnerId` : Votre identifiant partenaire (doit correspondre au token)
- `externalOrderRef` : Référence unique de la commande dans votre système
- `externalCustomerRef` : Référence unique du client dans votre système (pas de PII)
- `purchaseAmount` : Montant de l'achat (en FCFA)
- `installmentCount` : Nombre d'échéances (1-36)
- `notes` : Notes optionnelles
- `totalActiveCredits` : Nombre de crédits actifs du partenaire

#### Réponse (201 Created)

```json
{
  "creditReservationId": "123e4567-e89b-12d3-a456-426614174000",
  "partnerId": "pk_5d549668c41741f6",
  "externalOrderRef": "CMD_ORANGE_001",
  "externalCustomerRef": "CUST_12345",
  "purchaseAmount": 250000.00,
  "installmentCount": 6,
  "status": "RESERVED",
  "paymentPlanJson": "{\"type\":\"equal_installments\",\"frequency\":\"monthly\"}",
  "reservationDate": "2024-11-15",
  "expectedCompletionDate": "2025-05-15",
  "actualCompletionDate": null,
  "notes": "Achat smartphone Samsung Galaxy A54",
  "createdAt": "2024-11-15T10:35:00Z",
  "updatedAt": "2024-11-15T10:35:00Z",
  "totalAmount": 250000.00,
  "interestAmount": 0.00,
  "monthlyPayment": 41666.67,
  "downPaymentAmount": 0.00,
  "installments": [
    {
      "installmentId": "234e5678-f90c-23e4-b567-537725285111",
      "creditReservationId": "123e4567-e89b-12d3-a456-426614174000",
      "installmentNumber": 1,
      "dueDate": "2024-12-15",
      "amountDue": 41666.67,
      "amountPaid": 0.00,
      "status": "PENDING",
      "isPaid": false,
      "isOverdue": false,
      "reminderSentCount": 0,
      "createdAt": "2024-11-15T10:35:00Z",
      "updatedAt": "2024-11-15T10:35:00Z"
    },
    {
      "installmentId": "345e6789-g01d-34f5-c678-648836396222",
      "installmentNumber": 2,
      "dueDate": "2025-01-15",
      "amountDue": 41666.67,
      "status": "PENDING"
    }
    // ... 4 autres échéances
  ],
  "repaymentRate": 0.00,
  "totalInstallmentsPaid": 0,
  "totalInstallmentsLate": 0,
  "overallPaymentBehavior": "ON_TIME",
  "portfolioAnalytics": {},
  "hasDefaulted": false,
  "firstDefaultDate": null
}
```

**Statuts possibles** :
- `RESERVED` : Réservation créée, en attente d'activation
- `ACTIVE` : Crédit activé, paiements en cours
- `COMPLETED` : Tous les paiements effectués
- `CANCELLED` : Réservation annulée
- `DEFAULTED` : Défaut de paiement

#### Erreurs Possibles

```json
// 400 Bad Request - Données invalides
{
  "timestamp": "2024-11-15T10:35:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "purchaseAmount must be greater than 0",
  "path": "/v1/credits/reservations"
}

// 403 Forbidden - Tentative de création pour un autre partenaire
{
  "timestamp": "2024-11-15T10:35:00Z",
  "status": 403,
  "error": "Forbidden",
  "message": "Vous ne pouvez créer des réservations que pour votre propre compte",
  "path": "/v1/credits/reservations"
}

// 409 Conflict - Référence externe déjà existante
{
  "timestamp": "2024-11-15T10:35:00Z",
  "status": 409,
  "error": "Conflict",
  "message": "Une réservation avec la référence CMD_ORANGE_001 existe déjà",
  "path": "/v1/credits/reservations"
}
```

### 2. Récupérer une Réservation par ID

**Endpoint** : `GET /v1/credits/reservations/{id}`

#### Requête

```http
GET /v1/credits/reservations/123e4567-e89b-12d3-a456-426614174000
Authorization: Bearer tok_e8f7d6c5b4a39281
```

#### Réponse (200 OK)

Même structure que la réponse de création.

### 3. Récupérer une Réservation par Référence Externe

**Endpoint** : `GET /v1/credits/reservations/external/{externalOrderRef}`

#### Requête

```http
GET /v1/credits/reservations/external/CMD_ORANGE_001
Authorization: Bearer tok_e8f7d6c5b4a39281
```

#### Réponse (200 OK)

Même structure que la réponse de création.

### 4. Lister Toutes vos Réservations

**Endpoint** : `GET /v1/credits/reservations`

**Paramètres optionnels** :
- `status` : Filtrer par statut (RESERVED, ACTIVE, COMPLETED, CANCELLED, DEFAULTED)

#### Requête

```http
GET /v1/credits/reservations?status=ACTIVE
Authorization: Bearer tok_e8f7d6c5b4a39281
```

#### Réponse (200 OK)

```json
[
  {
    "creditReservationId": "123e4567-e89b-12d3-a456-426614174000",
    "externalOrderRef": "CMD_ORANGE_001",
    "status": "ACTIVE",
    "purchaseAmount": 250000.00,
    "installmentCount": 6
    // ... autres champs
  },
  {
    "creditReservationId": "234e5678-f90c-23e4-b567-537725285111",
    "externalOrderRef": "CMD_ORANGE_002",
    "status": "ACTIVE",
    "purchaseAmount": 180000.00,
    "installmentCount": 3
    // ... autres champs
  }
]
```

### 5. Mettre à Jour le Statut d'une Réservation

**Endpoint** : `PATCH /v1/credits/reservations/{id}/status`

**Paramètres** :
- `status` : Nouveau statut (RESERVED, ACTIVE, COMPLETED, CANCELLED, DEFAULTED)

#### Requête

```http
PATCH /v1/credits/reservations/123e4567-e89b-12d3-a456-426614174000/status?status=ACTIVE
Authorization: Bearer tok_e8f7d6c5b4a39281
```

#### Réponse (200 OK)

Même structure que la réponse de création avec le statut mis à jour.

### 6. Annuler une Réservation

**Endpoint** : `POST /v1/credits/reservations/{id}/cancel`

#### Requête

```http
POST /v1/credits/reservations/123e4567-e89b-12d3-a456-426614174000/cancel
Authorization: Bearer tok_e8f7d6c5b4a39281
```

#### Réponse (200 OK)

Même structure avec `status: "CANCELLED"`.

### 7. Statistiques de vos Réservations

**Endpoint** : `GET /v1/credits/reservations/stats`

#### Requête

```http
GET /v1/credits/reservations/stats
Authorization: Bearer tok_e8f7d6c5b4a39281
```

#### Réponse (200 OK)

```json
{
  "totalReservations": 156,
  "activeReservations": 87,
  "completedReservations": 54,
  "cancelledReservations": 12,
  "defaultedReservations": 3,
  "totalAmount": 45000000.00,
  "totalPaidAmount": 28000000.00,
  "averageReservationAmount": 288461.54,
  "averageRepaymentRate": 0.78,
  "overallPaymentBehavior": "ON_TIME"
}
```

---

## Gestion des Échéances

### 1. Récupérer une Échéance par ID

**Endpoint** : `GET /v1/installments/{id}`

#### Requête

```http
GET /v1/installments/234e5678-f90c-23e4-b567-537725285111
Authorization: Bearer tok_e8f7d6c5b4a39281
```

#### Réponse (200 OK)

```json
{
  "installmentId": "234e5678-f90c-23e4-b567-537725285111",
  "creditReservationId": "123e4567-e89b-12d3-a456-426614174000",
  "installmentNumber": 1,
  "dueDate": "2024-12-15",
  "amountDue": 41666.67,
  "amountPaid": 41666.67,
  "paidDate": "2024-12-14",
  "externalPaymentRef": "PAY_ORANGE_001",
  "status": "PAID",
  "isPaid": true,
  "isOverdue": false,
  "daysLate": 0,
  "lateFee": 0.00,
  "reminderSentCount": 1,
  "lastReminderSentDate": "2024-12-10",
  "createdAt": "2024-11-15T10:35:00Z",
  "updatedAt": "2024-12-14T15:20:00Z"
}
```

**Statuts possibles** :
- `PENDING` : En attente de paiement
- `PAID` : Payé
- `OVERDUE` : En retard
- `CANCELLED` : Annulé

### 2. Lister les Échéances d'une Réservation

**Endpoint** : `GET /v1/installments/reservation/{creditReservationId}`

#### Requête

```http
GET /v1/installments/reservation/123e4567-e89b-12d3-a456-426614174000
Authorization: Bearer tok_e8f7d6c5b4a39281
```

#### Réponse (200 OK)

```json
[
  {
    "installmentId": "234e5678-f90c-23e4-b567-537725285111",
    "installmentNumber": 1,
    "status": "PAID",
    "amountDue": 41666.67,
    "amountPaid": 41666.67
  },
  {
    "installmentId": "345e6789-g01d-34f5-c678-648836396222",
    "installmentNumber": 2,
    "status": "PENDING",
    "amountDue": 41666.67,
    "amountPaid": 0.00
  }
  // ... autres échéances
]
```

### 3. Traiter un Paiement

**Endpoint** : `POST /v1/installments/{installmentId}/payments`

**Paramètres** :
- `paidAmount` : Montant payé
- `externalPaymentRef` : Référence du paiement dans votre système

#### Requête

```http
POST /v1/installments/234e5678-f90c-23e4-b567-537725285111/payments?paidAmount=41666.67&externalPaymentRef=PAY_ORANGE_001
Authorization: Bearer tok_e8f7d6c5b4a39281
```

#### Réponse (200 OK)

```json
{
  "installmentId": "234e5678-f90c-23e4-b567-537725285111",
  "status": "PAID",
  "amountPaid": 41666.67,
  "paidDate": "2024-12-14",
  "externalPaymentRef": "PAY_ORANGE_001",
  "isPaid": true,
  "daysLate": -1,
  "updatedAt": "2024-12-14T15:20:00Z"
}
```

#### Erreurs Possibles

```json
// 400 Bad Request - Montant invalide
{
  "timestamp": "2024-12-14T15:20:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Le montant payé doit être positif",
  "path": "/v1/installments/234e5678-f90c-23e4-b567-537725285111/payments"
}

// 409 Conflict - Échéance déjà payée
{
  "timestamp": "2024-12-14T15:20:00Z",
  "status": 409,
  "error": "Conflict",
  "message": "Cette échéance est déjà payée",
  "path": "/v1/installments/234e5678-f90c-23e4-b567-537725285111/payments"
}
```

### 4. Lister les Échéances à Venir

**Endpoint** : `GET /v1/installments/upcoming`

**Paramètres** :
- `daysAhead` : Nombre de jours à venir (défaut: 30)

#### Requête

```http
GET /v1/installments/upcoming?daysAhead=7
Authorization: Bearer tok_e8f7d6c5b4a39281
```

#### Réponse (200 OK)

```json
[
  {
    "installmentId": "345e6789-g01d-34f5-c678-648836396222",
    "creditReservationId": "123e4567-e89b-12d3-a456-426614174000",
    "dueDate": "2024-12-20",
    "amountDue": 41666.67,
    "status": "PENDING",
    "daysUntilDue": 5
  }
]
```

### 5. Envoyer un Rappel de Paiement

**Endpoint** : `POST /v1/installments/{installmentId}/reminders`

#### Requête

```http
POST /v1/installments/345e6789-g01d-34f5-c678-648836396222/reminders
Authorization: Bearer tok_e8f7d6c5b4a39281
```

#### Réponse (200 OK)

```json
{
  "installmentId": "345e6789-g01d-34f5-c678-648836396222",
  "reminderSent": true,
  "timestamp": 1702826400000
}
```

### 6. Mettre à Jour le Statut d'une Échéance

**Endpoint** : `PATCH /v1/installments/{installmentId}/status`

**Rôle requis** : ADMIN, SUPER_ADMIN, OPERATIONS

**Paramètres** :
- `newStatus` : Nouveau statut (PENDING, PAID, OVERDUE, CANCELLED)

#### Requête

```http
PATCH /v1/installments/345e6789-g01d-34f5-c678-648836396222/status?newStatus=OVERDUE
Authorization: Bearer admin_tok_xyz123
```

---

## Instructions de Paiement

Les instructions de paiement sont des documents enrichis avec toutes les méthodes de paiement configurées par le partenaire.

### 1. Générer une Instruction de Paiement

**Endpoint** : `POST /v1/payment-instructions`

#### Requête

```http
POST /v1/payment-instructions
Authorization: Bearer tok_e8f7d6c5b4a39281
Content-Type: application/json

{
  "installmentId": "345e6789-g01d-34f5-c678-648836396222",
  "partnerId": "pk_5d549668c41741f6",
  "amountDue": 41666.67,
  "dueDate": "2024-12-20T23:59:59",
  "instructionType": "STANDARD",
  "language": "fr",
  "channel": "SMS",
  "validityHours": 72,
  "callbackUrl": "https://yourapi.com/webhooks/payment-viewed",
  "customFields": {
    "customerPhone": "+221771234567",
    "orderRef": "CMD_ORANGE_001"
  }
}
```

**Champs** :
- `installmentId` : ID de l'échéance
- `partnerId` : Votre ID partenaire
- `amountDue` : Montant à payer
- `dueDate` : Date d'échéance
- `instructionType` : Type d'instruction (STANDARD, REMINDER_3_DAYS, REMINDER_1_DAY, URGENT, OVERDUE)
- `language` : Langue (fr, wo, en)
- `channel` : Canal de diffusion (SMS, EMAIL, PUSH, IN_APP, WHATSAPP)
- `validityHours` : Durée de validité (défaut: 72h)

#### Réponse (201 Created)

```json
{
  "paymentInstructionId": "456f7890-h12e-45g6-d789-759947507333",
  "installmentId": "345e6789-g01d-34f5-c678-648836396222",
  "partnerId": "pk_5d549668c41741f6",
  "reference": "KRD-202412-ABC123",
  "amountDue": 41666.67,
  "dueDate": "2024-12-20T23:59:59",
  "instructionType": "STANDARD",
  "language": "fr",
  "channel": "SMS",
  "status": "GENERATED",
  "generatedAt": "2024-12-15T10:00:00Z",
  "expiresAt": "2024-12-18T10:00:00Z",
  "viewedAt": null,
  "sentAt": null,
  "instructionContent": {
    "title": "Rappel de Paiement - Échéance #2",
    "message": "Bonjour, votre échéance de 41.666,67 FCFA est due le 20/12/2024. Référence: KRD-202412-ABC123",
    "smsDescription": "Echeance 41.666F due 20/12. Ref: KRD-202412-ABC123. Payer via Wave/OM/FM ou banque.",
    "paymentMethods": [
      {
        "type": "MOBILE_MONEY",
        "provider": "WAVE",
        "accountNumber": "771234567",
        "accountName": "Orange Money Senegal",
        "instructions": "Composez *123# et suivez les instructions",
        "ussdCode": "*123*1*41666*771234567#",
        "qrCode": null
      },
      {
        "type": "MOBILE_MONEY",
        "provider": "ORANGE_MONEY",
        "accountNumber": "775678901",
        "instructions": "Composez #144# pour Orange Money",
        "ussdCode": "#144*1*41666*775678901#"
      },
      {
        "type": "BANK_TRANSFER",
        "bankName": "UBA Sénégal",
        "iban": "SN08 SN08 0100 1234 5678 9012 3456 78",
        "accountNumber": "12345678901234",
        "accountName": "Orange Money Senegal",
        "swiftCode": "UNAFSNDA",
        "branchCode": "DAKAR",
        "reference": "KRD-202412-ABC123"
      }
    ],
    "supportContact": {
      "phone": "+221338601234",
      "email": "support@orangemoney.sn",
      "whatsapp": "+221771234567"
    }
  },
  "metadata": {
    "generationDuration": 245,
    "methodsCount": 3,
    "customerPhone": "+221771234567",
    "orderRef": "CMD_ORANGE_001"
  },
  "createdAt": "2024-12-15T10:00:00Z",
  "updatedAt": "2024-12-15T10:00:00Z"
}
```

**Statuts possibles** :
- `GENERATED` : Instruction générée
- `SENT` : Instruction envoyée au client
- `VIEWED` : Instruction vue par le client
- `EXPIRED` : Instruction expirée

### 2. Récupérer une Instruction par ID

**Endpoint** : `GET /v1/payment-instructions/{id}`

#### Requête

```http
GET /v1/payment-instructions/456f7890-h12e-45g6-d789-759947507333
Authorization: Bearer tok_e8f7d6c5b4a39281
```

### 3. Récupérer une Instruction par Référence

**Endpoint** : `GET /v1/payment-instructions/reference/{reference}`

#### Requête

```http
GET /v1/payment-instructions/reference/KRD-202412-ABC123
Authorization: Bearer tok_e8f7d6c5b4a39281
```

### 4. Lister les Instructions Actives d'une Échéance

**Endpoint** : `GET /v1/payment-instructions/installment/{installmentId}/active`

#### Requête

```http
GET /v1/payment-instructions/installment/345e6789-g01d-34f5-c678-648836396222/active
Authorization: Bearer tok_e8f7d6c5b4a39281
```

### 5. Marquer une Instruction comme Vue

**Endpoint** : `PATCH /v1/payment-instructions/{id}/view`

#### Requête

```http
PATCH /v1/payment-instructions/456f7890-h12e-45g6-d789-759947507333/view
Authorization: Bearer tok_e8f7d6c5b4a39281
```

#### Réponse (200 OK)

```json
{
  "paymentInstructionId": "456f7890-h12e-45g6-d789-759947507333",
  "status": "VIEWED",
  "viewedAt": "2024-12-15T11:30:00Z"
}
```

### 6. Marquer une Instruction comme Envoyée

**Endpoint** : `PATCH /v1/payment-instructions/{id}/send`

#### Requête

```http
PATCH /v1/payment-instructions/456f7890-h12e-45g6-d789-759947507333/send
Authorization: Bearer tok_e8f7d6c5b4a39281
```

### 7. Régénérer une Instruction Expirée

**Endpoint** : `POST /v1/payment-instructions/{id}/regenerate`

**Paramètres** :
- `validityHours` : Durée de validité pour la nouvelle instruction (défaut: 48h)

#### Requête

```http
POST /v1/payment-instructions/456f7890-h12e-45g6-d789-759947507333/regenerate?validityHours=48
Authorization: Bearer tok_e8f7d6c5b4a39281
```

### 8. Valider une Référence de Paiement

**Endpoint** : `GET /v1/payment-instructions/validate/{reference}`

**Description** : Endpoint public pour valider une référence (utilisé par les clients).

#### Requête

```http
GET /v1/payment-instructions/validate/KRD-202412-ABC123
```

#### Réponse (200 OK)

```json
{
  "valid": true,
  "reference": "KRD-202412-ABC123",
  "amount": 41666.67,
  "dueDate": "2024-12-20T23:59:59",
  "status": "GENERATED",
  "expired": false
}
```

---

## Codes d'Erreur

### Codes HTTP Standard

| Code | Description | Signification |
|------|-------------|---------------|
| 200 | OK | Requête réussie |
| 201 | Created | Ressource créée avec succès |
| 400 | Bad Request | Données de requête invalides |
| 401 | Unauthorized | Token manquant ou invalide |
| 403 | Forbidden | Accès refusé (permissions insuffisantes) |
| 404 | Not Found | Ressource non trouvée |
| 409 | Conflict | Conflit (ex: référence en double) |
| 410 | Gone | Ressource expirée |
| 429 | Too Many Requests | Rate limit dépassé |
| 500 | Internal Server Error | Erreur serveur |

### Format des Erreurs

```json
{
  "timestamp": "2024-11-15T10:35:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Le montant doit être supérieur à 0",
  "path": "/v1/credits/reservations",
  "details": {
    "field": "purchaseAmount",
    "rejectedValue": -1000,
    "constraint": "must be greater than 0"
  }
}
```

---

## Bonnes Pratiques

### 1. Sécurité

- **HTTPS uniquement** : N'utilisez jamais HTTP en production
- **Rotation des tokens** : Utilisez le refresh token avant expiration
- **Stockage sécurisé** : Ne stockez jamais les tokens en clair
- **Révocation** : Révoquez immédiatement en cas de compromission
- **API Keys** : Ne partagez jamais votre `clientSecret`

### 2. Gestion des Erreurs

```javascript
// Exemple Node.js
async function createReservation(data) {
  try {
    const response = await fetch('https://api.kredika.sn/api/v1/credits/reservations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();

      if (response.status === 401) {
        // Token expiré, rafraîchir et réessayer
        await refreshAccessToken();
        return createReservation(data);
      }

      if (response.status === 409) {
        // Référence en double
        console.error('Duplicate reference:', error.message);
        throw new Error('Cette commande existe déjà');
      }

      throw new Error(error.message);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating reservation:', error);
    throw error;
  }
}
```

### 3. Idempotence

- Utilisez toujours des `externalOrderRef` uniques
- En cas d'erreur réseau, vérifiez si la réservation existe avant de recréer
- Stockez les IDs Kredika dans votre base de données

### 4. Performance

- **Pagination** : Utilisez les filtres pour limiter les résultats
- **Cache** : Mettez en cache les données non critiques
- **Batch** : Groupez les requêtes quand possible
- **Webhooks** : Préférez les webhooks au polling (à venir)

### 5. Monitoring

```javascript
// Exemple de monitoring des erreurs
const monitorAPI = async (operation, fn) => {
  const startTime = Date.now();

  try {
    const result = await fn();
    const duration = Date.now() - startTime;

    // Log success
    console.log({
      operation,
      status: 'success',
      duration,
      timestamp: new Date().toISOString()
    });

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;

    // Log error
    console.error({
      operation,
      status: 'error',
      error: error.message,
      duration,
      timestamp: new Date().toISOString()
    });

    // Send to monitoring service (Sentry, DataDog, etc.)
    throw error;
  }
};

// Usage
const reservation = await monitorAPI('create_reservation', () =>
  createReservation(data)
);
```

### 6. Exemples d'Intégration Complète

#### Node.js / Express

```javascript
const axios = require('axios');

class KredikaClient {
  constructor(clientId, clientSecret, baseUrl = 'https://api.kredika.sn/api') {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.baseUrl = baseUrl;
    this.accessToken = null;
    this.refreshToken = null;
  }

  async authenticate() {
    const response = await axios.post(`${this.baseUrl}/v1/auth/token`, {
      clientId: this.clientId,
      clientSecret: this.clientSecret
    });

    this.accessToken = response.data.accessToken;
    this.refreshToken = response.data.refreshToken;

    return response.data;
  }

  async refreshAccessToken() {
    const response = await axios.post(`${this.baseUrl}/v1/auth/refresh`, {
      refreshToken: this.refreshToken
    });

    this.accessToken = response.data.accessToken;
    this.refreshToken = response.data.refreshToken;

    return response.data;
  }

  async createReservation(data) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/v1/credits/reservations`,
        data,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        // Token expiré, rafraîchir et réessayer
        await this.refreshAccessToken();
        return this.createReservation(data);
      }
      throw error;
    }
  }

  async processPayment(installmentId, paidAmount, externalPaymentRef) {
    const response = await axios.post(
      `${this.baseUrl}/v1/installments/${installmentId}/payments`,
      null,
      {
        params: { paidAmount, externalPaymentRef },
        headers: { 'Authorization': `Bearer ${this.accessToken}` }
      }
    );

    return response.data;
  }
}

// Usage
const kredika = new KredikaClient('pk_5d549668c41741f6', 'sk_live_xxx');
await kredika.authenticate();

const reservation = await kredika.createReservation({
  partnerId: 'pk_5d549668c41741f6',
  externalOrderRef: 'CMD_001',
  externalCustomerRef: 'CUST_12345',
  purchaseAmount: 250000,
  installmentCount: 6
});
```

#### Python / Flask

```python
import requests
from datetime import datetime, timedelta

class KredikaClient:
    def __init__(self, client_id, client_secret, base_url='https://api.kredika.sn/api'):
        self.client_id = client_id
        self.client_secret = client_secret
        self.base_url = base_url
        self.access_token = None
        self.refresh_token = None
        self.token_expires_at = None

    def authenticate(self):
        response = requests.post(
            f'{self.base_url}/v1/auth/token',
            json={
                'clientId': self.client_id,
                'clientSecret': self.client_secret
            }
        )
        response.raise_for_status()

        data = response.json()
        self.access_token = data['accessToken']
        self.refresh_token = data['refreshToken']
        self.token_expires_at = datetime.now() + timedelta(seconds=data['expiresIn'])

        return data

    def refresh_access_token(self):
        response = requests.post(
            f'{self.base_url}/v1/auth/refresh',
            json={'refreshToken': self.refresh_token}
        )
        response.raise_for_status()

        data = response.json()
        self.access_token = data['accessToken']
        self.refresh_token = data['refreshToken']
        self.token_expires_at = datetime.now() + timedelta(seconds=data['expiresIn'])

        return data

    def _ensure_valid_token(self):
        if not self.access_token or datetime.now() >= self.token_expires_at:
            if self.refresh_token:
                self.refresh_access_token()
            else:
                self.authenticate()

    def create_reservation(self, data):
        self._ensure_valid_token()

        response = requests.post(
            f'{self.base_url}/v1/credits/reservations',
            json=data,
            headers={'Authorization': f'Bearer {self.access_token}'}
        )
        response.raise_for_status()

        return response.json()

# Usage
kredika = KredikaClient('pk_5d549668c41741f6', 'sk_live_xxx')
kredika.authenticate()

reservation = kredika.create_reservation({
    'partnerId': 'pk_5d549668c41741f6',
    'externalOrderRef': 'CMD_001',
    'externalCustomerRef': 'CUST_12345',
    'purchaseAmount': 250000.0,
    'installmentCount': 6
})
```

#### PHP / Laravel

```php
<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class KredikaService
{
    private $clientId;
    private $clientSecret;
    private $baseUrl;

    public function __construct()
    {
        $this->clientId = config('kredika.client_id');
        $this->clientSecret = config('kredika.client_secret');
        $this->baseUrl = config('kredika.base_url', 'https://api.kredika.sn/api');
    }

    public function authenticate()
    {
        $response = Http::post("{$this->baseUrl}/v1/auth/token", [
            'clientId' => $this->clientId,
            'clientSecret' => $this->clientSecret,
        ]);

        $data = $response->json();

        // Cache le token
        Cache::put('kredika_access_token', $data['accessToken'], now()->addSeconds($data['expiresIn'] - 300));
        Cache::put('kredika_refresh_token', $data['refreshToken'], now()->addDays(30));

        return $data;
    }

    private function getAccessToken()
    {
        $token = Cache::get('kredika_access_token');

        if (!$token) {
            $this->authenticate();
            $token = Cache::get('kredika_access_token');
        }

        return $token;
    }

    public function createReservation(array $data)
    {
        $response = Http::withToken($this->getAccessToken())
            ->post("{$this->baseUrl}/v1/credits/reservations", $data);

        if ($response->status() === 401) {
            // Token expiré, réauthentifier et réessayer
            Cache::forget('kredika_access_token');
            return $this->createReservation($data);
        }

        $response->throw();

        return $response->json();
    }

    public function processPayment(string $installmentId, float $paidAmount, string $externalPaymentRef)
    {
        $response = Http::withToken($this->getAccessToken())
            ->post("{$this->baseUrl}/v1/installments/{$installmentId}/payments", null, [
                'paidAmount' => $paidAmount,
                'externalPaymentRef' => $externalPaymentRef,
            ]);

        $response->throw();

        return $response->json();
    }
}

// Usage dans un controller
$kredika = app(KredikaService::class);

$reservation = $kredika->createReservation([
    'partnerId' => 'pk_5d549668c41741f6',
    'externalOrderRef' => 'CMD_001',
    'externalCustomerRef' => 'CUST_12345',
    'purchaseAmount' => 250000.0,
    'installmentCount' => 6,
]);
```

---

## Support

### Documentation

- **Swagger UI** : `https://api.kredika.sn/api/swagger-ui/index.html`
- **OpenAPI Spec** : `https://api.kredika.sn/api/v3/api-docs`

### Contact

- **Email** : support@kredika.sn
- **Slack** : kredika-partners.slack.com
- **GitHub** : github.com/kredika/kredika-core

### SLA

- **Disponibilité** : 99.9% uptime
- **Temps de réponse** : < 200ms (P95)
- **Support** : 24/7 pour les incidents critiques

### Changelog

Consultez le fichier `CHANGELOG.md` pour les mises à jour de l'API.

### Versioning

Kredika suit la versioning sémantique (semver). Les breaking changes seront annoncés 90 jours à l'avance.

---

**Version** : 1.0.0
**Dernière mise à jour** : 15 novembre 2024
**Auteur** : Équipe Kredika Core
