const AdminSettings = require('../models/AdminSettings');
const kredikaService = require('../services/kredikaService');

const getSettings = async (req, res) => {
  try {
    const settings = await AdminSettings.getInstance();
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateSettings = async (req, res) => {
  try {
    const settings = await AdminSettings.getInstance();
    
    // Mettre à jour uniquement les champs fournis
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        if (typeof req.body[key] === 'object' && !Array.isArray(req.body[key]) && req.body[key] !== null) {
          // Pour les objets imbriqués, fusionner les propriétés
          settings[key] = { ...settings[key], ...req.body[key] };
        } else {
          settings[key] = req.body[key];
        }
      }
    });
    
    settings.lastModifiedBy = req.user.id;
    await settings.save();
    
    // Si les paramètres Kredika ont été modifiés, mettre à jour le service
    if (req.body.kredika) {
      kredikaService.updateConfig(settings.kredika);
    }
    
    res.json({
      success: true,
      data: settings,
      message: 'Settings updated successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateKredikaSettings = async (req, res) => {
  try {
    const {
      commissionRate,
      fixedCommission,
      minimumAmount,
      maximumAmount,
      installmentOptions,
      feeStructure
    } = req.body;
    
    const settings = await AdminSettings.getInstance();
    
    // Validation des paramètres Kredika
    if (commissionRate !== undefined && (commissionRate < 0 || commissionRate > 0.1)) {
      return res.status(400).json({
        message: 'Commission rate must be between 0% and 10%'
      });
    }
    
    if (minimumAmount !== undefined && minimumAmount < 1) {
      return res.status(400).json({
        message: 'Minimum amount cannot be less than 1€'
      });
    }
    
    // Mettre à jour les paramètres Kredika
    if (commissionRate !== undefined) settings.kredika.commissionRate = commissionRate;
    if (fixedCommission !== undefined) settings.kredika.fixedCommission = fixedCommission;
    if (minimumAmount !== undefined) settings.kredika.minimumAmount = minimumAmount;
    if (maximumAmount !== undefined) settings.kredika.maximumAmount = maximumAmount;
    if (installmentOptions !== undefined) settings.kredika.installmentOptions = installmentOptions;
    if (feeStructure !== undefined) settings.kredika.feeStructure = { ...settings.kredika.feeStructure, ...feeStructure };
    
    settings.lastModifiedBy = req.user.id;
    await settings.save();
    
    // Mettre à jour la configuration du service Kredika
    kredikaService.updateConfig(settings.kredika);
    
    res.json({
      success: true,
      data: settings.kredika,
      message: 'Kredika settings updated successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const calculateKredikaFees = async (req, res) => {
  try {
    const { amount, months } = req.query;
    
    if (!amount || !months) {
      return res.status(400).json({
        message: 'Amount and months are required'
      });
    }
    
    const settings = await AdminSettings.getInstance();
    const kredikaSettings = settings.kredika;
    
    // Calculer les frais basés sur la durée
    let feeConfig;
    switch (parseInt(months)) {
      case 3:
        feeConfig = kredikaSettings.feeStructure.threeMonths;
        break;
      case 6:
        feeConfig = kredikaSettings.feeStructure.sixMonths;
        break;
      case 12:
        feeConfig = kredikaSettings.feeStructure.twelveMonths;
        break;
      case 24:
        feeConfig = kredikaSettings.feeStructure.twentyFourMonths;
        break;
      default:
        return res.status(400).json({
          message: 'Invalid installment duration. Must be 3, 6, 12, or 24 months'
        });
    }
    
    const baseAmount = parseFloat(amount);
    const interestAmount = baseAmount * feeConfig.rate;
    const fixedFee = feeConfig.fixedFee;
    const totalAmount = baseAmount + interestAmount + fixedFee;
    const monthlyPayment = totalAmount / parseInt(months);
    
    // Commission pour l'admin
    const adminCommission = baseAmount * kredikaSettings.commissionRate + kredikaSettings.fixedCommission;
    
    res.json({
      success: true,
      data: {
        baseAmount,
        interestAmount,
        fixedFee,
        totalAmount,
        monthlyPayment: Math.round(monthlyPayment * 100) / 100,
        adminCommission: Math.round(adminCommission * 100) / 100,
        months: parseInt(months),
        apr: feeConfig.rate * 100 // Taux annuel en pourcentage
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const resetToDefaults = async (req, res) => {
  try {
    // Supprimer les paramètres existants
    await AdminSettings.deleteMany({});
    
    // Créer de nouveaux paramètres par défaut
    const defaultSettings = new AdminSettings({});
    defaultSettings.lastModifiedBy = req.user.id;
    await defaultSettings.save();
    
    res.json({
      success: true,
      data: defaultSettings,
      message: 'Settings reset to defaults successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getSettings,
  updateSettings,
  updateKredikaSettings,
  calculateKredikaFees,
  resetToDefaults
};