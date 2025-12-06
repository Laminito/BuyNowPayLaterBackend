const express = require('express');
const {
  handleKredikaWebhook,
  testWebhook
} = require('../controllers/webhooks');

const router = express.Router();

/**
 * @route   POST /api/webhooks/kredika
 * @desc    Handle Kredika payment webhooks
 * @access  Public (but secured with signature verification)
 */
router.post('/kredika', handleKredikaWebhook);

/**
 * @route   POST /api/webhooks/test
 * @desc    Test webhook endpoint
 * @access  Public
 */
router.post('/test', testWebhook);

/**
 * @route   GET /api/webhooks/test
 * @desc    Test webhook endpoint (GET)
 * @access  Public
 */
router.get('/test', testWebhook);

module.exports = router;