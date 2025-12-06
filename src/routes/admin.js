const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  getSettings,
  updateSettings,
  updateKredikaSettings,
  calculateKredikaFees,
  resetToDefaults
} = require('../controllers/adminSettings');

const router = express.Router();

// Toutes les routes nécessitent une authentification admin
router.use(protect);
router.use(authorize('admin'));

/**
 * @route   GET /api/admin/settings
 * @desc    Get admin settings
 * @access  Private/Admin
 */
router.get('/settings', getSettings);

/**
 * @route   PUT /api/admin/settings
 * @desc    Update admin settings
 * @access  Private/Admin
 */
router.put('/settings', updateSettings);

/**
 * @route   PUT /api/admin/settings/kredika
 * @desc    Update Kredika settings
 * @access  Private/Admin
 */
router.put('/settings/kredika', updateKredikaSettings);

/**
 * @route   GET /api/admin/kredika/calculate-fees
 * @desc    Calculate Kredika fees for given amount and duration
 * @access  Private/Admin
 */
router.get('/kredika/calculate-fees', calculateKredikaFees);

/**
 * @route   POST /api/admin/settings/reset
 * @desc    Reset settings to defaults
 * @access  Private/Admin
 */
router.post('/settings/reset', resetToDefaults);

module.exports = router;