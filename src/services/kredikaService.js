const axios = require('axios');
const crypto = require('crypto');

/**
 * KredikaService - Intégration complète avec l'API Kredika Core
 * Support des réservations de crédit, échéances, et instructions de paiement
 */
class KredikaService {
  constructor() {
    this.baseUrl = process.env.KREDIKA_API_URL || 'http://localhost:7575/api/v1';
    this.partnerId = null; // Will be set by authenticate() from API response
    
    // OAuth2 credentials (optional)
    this.clientId = process.env.KREDIKA_CLIENT_ID;
    this.clientSecret = process.env.KREDIKA_CLIENT_SECRET;
    
    // API Key credentials (optional)
    this.apiKey = process.env.KREDIKA_API_KEY;
    this.partnerKey = process.env.KREDIKA_PARTNER_KEY;
    
    this.webhookSecret = process.env.KREDIKA_WEBHOOK_SECRET;
    
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiresAt = null;
    this.authMode = null; // Will be set by authenticate(): 'OAUTH2' or 'API_KEY'
    
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000
    });

    // Debug logging
    console.log(`\n🔑 Kredika Service initialized with:`);
    console.log(`   API URL: ${this.baseUrl}`);
    console.log(`   Partner ID: ${this.partnerId || '⏳ will be retrieved from auth'}`);
    console.log(`   OAuth2 Client ID: ${this.clientId ? '✓ configured' : '✗ MISSING - REQUIRED'}`);
    console.log(`   OAuth2 Client Secret: ${this.clientSecret ? '✓ configured' : '✗ MISSING - REQUIRED'}`);
    console.log(`   Webhook Secret: ${this.webhookSecret ? '✓ configured' : '✗ missing'}\n`);
  }

  /**
   * === AUTHENTIFICATION ===
   */

  /**
   * Authentifier le partenaire (Furniture Market) auprès de Kredika
   * POST /v1/auth/token
   * 
   * Utilisé pour obtenir un access token (24h) et refresh token (30j)
   * afin de faire des appels API sécurisés à Kredika
   */
  async authenticate() {
    try {
      // Recharger les variables d'environnement
      const apiKey = process.env.KREDIKA_API_KEY;
      const partnerKey = process.env.KREDIKA_PARTNER_KEY;
      const clientId = process.env.KREDIKA_CLIENT_ID;
      const clientSecret = process.env.KREDIKA_CLIENT_SECRET;

      console.log('\n🔐 Checking Kredika credentials...');
      console.log(`   KREDIKA_API_KEY: ${apiKey ? '✓ ' + apiKey.substring(0, 10) + '...' : '✗ MISSING'}`);
      console.log(`   KREDIKA_PARTNER_KEY: ${partnerKey ? '✓ ' + partnerKey.substring(0, 10) + '...' : '✗ MISSING'}`);
      console.log(`   KREDIKA_CLIENT_ID: ${clientId ? '✓ ' + clientId.substring(0, 10) + '...' : '✗ MISSING'}`);
      console.log(`   KREDIKA_CLIENT_SECRET: ${clientSecret ? '✓ ' + clientSecret.substring(0, 10) + '...' : '✗ MISSING'}`);

      // Priority 1: Try OAuth2 if credentials are available (pk_* and kred_* ARE valid OAuth2 creds)
      if (clientId && clientSecret) {
        console.log('🔐 Authenticating with Kredika OAuth2...');
        const response = await this.axiosInstance.post('/auth/token', {
          clientId: clientId,
          clientSecret: clientSecret
        });

        this.accessToken = response.data.accessToken;
        this.refreshToken = response.data.refreshToken;
        this.tokenExpiresAt = Date.now() + (response.data.expiresIn * 1000);
        // 🔥 The partnerId to send in API calls is the clientId itself (pk_*)
        this.partnerId = clientId;

        console.log('✅ Kredika OAuth2 authentication successful');
        console.log(`   Token expires in: ${response.data.expiresIn}s`);
        console.log(`   Scope: ${response.data.scope}`);
        console.log(`   Partner ID (for API): ${this.partnerId}`);
        this.authMode = 'OAUTH2';
        return response.data;
      }

      // Priority 2: Fall back to API Key authentication
      if (apiKey && partnerKey) {
        console.log('✅ Using API Key authentication (development mode)');
        this.accessToken = 'api-key-auth';
        this.tokenExpiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24h
        this.partnerId = partnerKey; // 🔥 Use partnerKey as partnerId for API Key mode
        this.authMode = 'API_KEY';
        return {
          accessToken: this.accessToken,
          tokenType: 'Bearer',
          expiresIn: 86400,
          mode: 'API_KEY',
          partnerId: this.partnerId
        };
      }

      // No credentials available
      throw new Error('Kredika credentials not configured: need either (KREDIKA_API_KEY + KREDIKA_PARTNER_KEY) or (KREDIKA_CLIENT_ID + KREDIKA_CLIENT_SECRET)');
      
    } catch (error) {
      console.error('❌ Kredika authentication failed:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Rafraîchir l'access token
   * POST /v1/auth/refresh
   */
  async refreshAccessToken() {
    try {
      if (!this.refreshToken) {
        await this.authenticate();
        return;
      }

      console.log('🔄 Refreshing Kredika token...');
      const response = await this.axiosInstance.post('/auth/refresh', {
        refreshToken: this.refreshToken
      });

      this.accessToken = response.data.accessToken;
      this.refreshToken = response.data.refreshToken;
      this.tokenExpiresAt = Date.now() + (response.data.expiresIn * 1000);
      this.partnerId = response.data.partnerId; // 🔥 Update partnerId on token refresh

      console.log('✅ Kredika token refreshed successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Kredika token refresh failed:', error.response?.data || error.message);
      // Réauthentifier si le refresh échoue
      await this.authenticate();
    }
  }

  /**
   * Assurer que le token est valide
   * Rafraîchit si besoin
   */
  async ensureValidToken() {
    if (!this.accessToken) {
      await this.authenticate();
    } else if (Date.now() >= this.tokenExpiresAt - 60000) { // Si < 1min restant
      await this.refreshAccessToken();
    }
  }

  /**
   * Vérifier la disponibilité de l'API Kredika
   * GET /health
   */
  async healthCheck() {
    try {
      const response = await this.axiosInstance.get('/health');
      console.log('✅ Kredika API is healthy');
      return response.data;
    } catch (error) {
      console.error('❌ Kredika health check failed:', error.message);
      throw error;
    }
  }

  /**
   * Obtenir les headers d'autorisation pour les requêtes API
   * Supporte OAuth2 (Bearer token) ET API Key authentication
   */
  getAuthHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };

    // Mode OAuth2: Bearer token
    if (this.authMode === 'OAUTH2' && this.accessToken && this.accessToken !== 'api-key-auth') {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }
    // Mode API Key: Headers d'authentification
    else if (this.authMode === 'API_KEY') {
      const apiKey = process.env.KREDIKA_API_KEY;
      const partnerKey = process.env.KREDIKA_PARTNER_KEY;
      
      if (apiKey) headers['X-API-Key'] = apiKey;
      if (partnerKey) headers['X-Partner-Key'] = partnerKey;
    }

    return headers;
  }

  /**
   * Obtenir les headers pour les endpoints de réservation (avec partenaire API Key en fallback)
   * Certains endpoints peuvent nécessiter les headers API Key en complément du Bearer token
   */
  getReservationHeaders() {
    const headers = this.getAuthHeaders();
    
    // Pour les réservations, ajouter aussi les headers API Key si disponibles
    // Cela permet à Kredika de valider la cohérence du partenaire
    const apiKey = process.env.KREDIKA_API_KEY;
    const partnerKey = process.env.KREDIKA_PARTNER_KEY;
    
    // Si on a les API Keys ET un Bearer token, envoyer les deux
    if (this.authMode === 'OAUTH2' && apiKey && partnerKey) {
      headers['X-API-Key'] = apiKey;
      headers['X-Partner-Key'] = partnerKey;
    }
    
    return headers;
  }

  /**
   * === GESTION DES RÉSERVATIONS DE CRÉDIT ===
   */

  /**
   * Créer une réservation de crédit
   * @param {Object} reservationData - Données de la réservation
   * @returns {Promise<Object>} Réservation créée
   */
  async createReservation(reservationData) {
    try {
      await this.ensureValidToken();

      // Format exact attendu par Kredika
      const payload = {
        partnerId: this.partnerId,
        externalOrderRef: reservationData.externalOrderRef,
        externalCustomerRef: reservationData.externalCustomerRef,
        purchaseAmount: parseFloat(reservationData.purchaseAmount),
        installmentCount: parseInt(reservationData.installmentCount) || 6,
        notes: reservationData.notes || ''
      };

      console.log('\n📤 Sending Kredika reservation payload:');
      console.log(JSON.stringify(payload, null, 2));

      const response = await this.axiosInstance.post(
        '/credits/reservations',
        payload,
        { headers: this.getReservationHeaders() }
      );

      console.log(`✅ Credit reservation created: ${response.data.creditReservationId}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error creating credit reservation:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Récupérer une réservation par ID
   */
  async getReservationById(reservationId) {
    try {
      await this.ensureValidToken();

      const response = await this.axiosInstance.get(
        `/credits/reservations/${reservationId}`,
        { headers: this.getAuthHeaders() }
      );

      return response.data;
    } catch (error) {
      console.error('❌ Error getting reservation:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Récupérer une réservation par référence externe
   */
  async getReservationByExternalRef(externalOrderRef) {
    try {
      await this.ensureValidToken();

      const response = await this.axiosInstance.get(
        `/credits/reservations/external/${externalOrderRef}`,
        { headers: this.getAuthHeaders() }
      );

      return response.data;
    } catch (error) {
      console.error('❌ Error getting reservation by ref:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Lister les réservations avec filtres optionnels
   */
  async listReservations(status = null) {
    try {
      await this.ensureValidToken();

      const url = status ? `/credits/reservations?status=${status}` : '/credits/reservations';

      const response = await this.axiosInstance.get(
        url,
        { headers: this.getAuthHeaders() }
      );

      return response.data;
    } catch (error) {
      console.error('❌ Error listing reservations:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Mettre à jour le statut d'une réservation
   */
  async updateReservationStatus(reservationId, status) {
    try {
      await this.ensureValidToken();

      const response = await this.axiosInstance.patch(
        `/credits/reservations/${reservationId}/status?status=${status}`,
        {},
        { headers: this.getAuthHeaders() }
      );

      console.log(`✅ Reservation status updated to ${status}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error updating reservation status:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Activer une réservation
   */
  async activateReservation(reservationId) {
    return this.updateReservationStatus(reservationId, 'ACTIVE');
  }

  /**
   * Annuler une réservation
   */
  async cancelReservation(reservationId) {
    try {
      await this.ensureValidToken();

      const response = await this.axiosInstance.post(
        `/credits/reservations/${reservationId}/cancel`,
        {},
        { headers: this.getAuthHeaders() }
      );

      console.log(`✅ Reservation cancelled: ${reservationId}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error cancelling reservation:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Obtenir les statistiques des réservations
   */
  async getReservationStats() {
    try {
      await this.ensureValidToken();

      const response = await this.axiosInstance.get(
        '/credits/reservations/stats',
        { headers: this.getAuthHeaders() }
      );

      return response.data;
    } catch (error) {
      console.error('❌ Error getting stats:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * === GESTION DES ÉCHÉANCES ===
   */

  /**
   * Récupérer une échéance par ID
   */
  async getInstallmentById(installmentId) {
    try {
      await this.ensureValidToken();

      const response = await this.axiosInstance.get(
        `/installments/${installmentId}`,
        { headers: this.getAuthHeaders() }
      );

      return response.data;
    } catch (error) {
      console.error('❌ Error getting installment:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Lister les échéances d'une réservation
   */
  async listInstallments(creditReservationId) {
    try {
      await this.ensureValidToken();

      const response = await this.axiosInstance.get(
        `/installments/reservation/${creditReservationId}`,
        { headers: this.getAuthHeaders() }
      );

      return response.data;
    } catch (error) {
      console.error('❌ Error listing installments:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Traiter un paiement pour une échéance
   */
  async processInstallmentPayment(installmentId, paidAmount, externalPaymentRef) {
    try {
      await this.ensureValidToken();

      const response = await this.axiosInstance.post(
        `/installments/${installmentId}/payments`,
        {},
        {
          headers: this.getAuthHeaders(),
          params: {
            paidAmount: parseFloat(paidAmount),
            externalPaymentRef: externalPaymentRef
          }
        }
      );

      console.log(`✅ Payment processed for installment: ${installmentId}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error processing payment:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Lister les échéances à venir
   */
  async listUpcomingInstallments(daysAhead = 30) {
    try {
      await this.ensureValidToken();

      const response = await this.axiosInstance.get(
        `/installments/upcoming?daysAhead=${daysAhead}`,
        { headers: this.getAuthHeaders() }
      );

      return response.data;
    } catch (error) {
      console.error('❌ Error listing upcoming installments:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Envoyer un rappel de paiement
   */
  async sendPaymentReminder(installmentId) {
    try {
      await this.ensureValidToken();

      const response = await this.axiosInstance.post(
        `/installments/${installmentId}/reminders`,
        {},
        { headers: this.getAuthHeaders() }
      );

      console.log(`✅ Reminder sent for installment: ${installmentId}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error sending reminder:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * === INSTRUCTIONS DE PAIEMENT ===
   */

  /**
   * Générer une instruction de paiement
   */
  async generatePaymentInstruction(instructionData) {
    try {
      await this.ensureValidToken();

      const payload = {
        installmentId: instructionData.installmentId,
        partnerId: this.clientId,
        amountDue: parseFloat(instructionData.amountDue),
        dueDate: instructionData.dueDate,
        instructionType: instructionData.instructionType || 'STANDARD',
        language: instructionData.language || 'fr',
        channel: instructionData.channel || 'SMS',
        validityHours: instructionData.validityHours || 72,
        callbackUrl: instructionData.callbackUrl || null,
        customFields: instructionData.customFields || {}
      };

      const response = await this.axiosInstance.post(
        '/payment-instructions',
        payload,
        { headers: this.getAuthHeaders() }
      );

      console.log(`✅ Payment instruction generated: ${response.data.paymentInstructionId}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error generating payment instruction:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Récupérer une instruction par ID
   */
  async getPaymentInstructionById(instructionId) {
    try {
      await this.ensureValidToken();

      const response = await this.axiosInstance.get(
        `/payment-instructions/${instructionId}`,
        { headers: this.getAuthHeaders() }
      );

      return response.data;
    } catch (error) {
      console.error('❌ Error getting payment instruction:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Récupérer les instructions actives d'une échéance
   */
  async getActivePaymentInstructions(installmentId) {
    try {
      await this.ensureValidToken();

      const response = await this.axiosInstance.get(
        `/payment-instructions/installment/${installmentId}/active`,
        { headers: this.getAuthHeaders() }
      );

      return response.data;
    } catch (error) {
      console.error('❌ Error getting active instructions:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Marquer une instruction comme vue
   */
  async markInstructionAsViewed(instructionId) {
    try {
      await this.ensureValidToken();

      const response = await this.axiosInstance.patch(
        `/payment-instructions/${instructionId}/view`,
        {},
        { headers: this.getAuthHeaders() }
      );

      return response.data;
    } catch (error) {
      console.error('❌ Error marking instruction as viewed:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Régénérer une instruction expirée
   */
  async regeneratePaymentInstruction(instructionId, validityHours = 48) {
    try {
      await this.ensureValidToken();

      const response = await this.axiosInstance.post(
        `/payment-instructions/${instructionId}/regenerate?validityHours=${validityHours}`,
        {},
        { headers: this.getAuthHeaders() }
      );

      console.log(`✅ Payment instruction regenerated: ${instructionId}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error regenerating instruction:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * === UTILITAIRES ===
   */

  /**
   * Traiter un webhook Kredika
   */
  processWebhook(payload, signature) {
    try {
      // Vérifier la signature du webhook (utiliser le clientSecret comme clé)
      const expectedSignature = crypto
        .createHmac('sha256', this.clientSecret)
        .update(JSON.stringify(payload))
        .digest('hex');

      if (signature !== expectedSignature) {
        throw new Error('Invalid webhook signature');
      }

      return {
        valid: true,
        event: payload.event,
        data: payload.data
      };
    } catch (error) {
      console.error('❌ Webhook processing error:', error.message);
      return { valid: false, error: error.message };
    }
  }

  /**
   * Mapper un statut Kredika à un statut local
   */
  mapKredikaStatus(kredikaStatus) {
    const mapping = {
      'RESERVED': 'pending',
      'ACTIVE': 'confirmed',
      'COMPLETED': 'delivered',
      'CANCELLED': 'cancelled',
      'DEFAULTED': 'cancelled'
    };
    return mapping[kredikaStatus] || 'pending';
  }

  /**
   * Formater les données de réservation pour stockage local
   */
  formatReservationForStorage(reservation) {
    return {
      kredika: {
        reservationId: reservation.creditReservationId,
        externalOrderRef: reservation.externalOrderRef,
        status: this.mapKredikaStatus(reservation.status),
        purchaseAmount: reservation.purchaseAmount,
        installmentCount: reservation.installmentCount,
        monthlyPayment: reservation.monthlyPayment,
        totalAmount: reservation.totalAmount,
        interestAmount: reservation.interestAmount,
        createdAt: reservation.createdAt,
        updatedAt: reservation.updatedAt,
        installments: reservation.installments || []
      }
    };
  }
}

module.exports = new KredikaService();


