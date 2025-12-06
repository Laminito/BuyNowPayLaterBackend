// Helper functions for the application

/**
 * Calculate monthly payment amount with interest
 * @param {number} principal - Principal amount
 * @param {number} rate - Annual interest rate (percentage)
 * @param {number} months - Number of months
 * @returns {number} Monthly payment amount
 */
const calculateMonthlyPayment = (principal, rate, months) => {
  if (rate === 0) {
    return principal / months;
  }
  
  const monthlyRate = rate / 100 / 12;
  const payment = (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / 
                  (Math.pow(1 + monthlyRate, months) - 1);
  
  return Math.round(payment * 100) / 100;
};

/**
 * Generate payment schedule
 * @param {number} amount - Total amount
 * @param {number} installments - Number of installments
 * @param {Date} startDate - Start date
 * @returns {Array} Payment schedule
 */
const generatePaymentSchedule = (amount, installments, startDate = new Date()) => {
  const installmentAmount = Math.round((amount / installments) * 100) / 100;
  const schedule = [];
  
  for (let i = 1; i <= installments; i++) {
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + i);
    
    schedule.push({
      number: i,
      amount: i === installments ? 
        // Adjust last payment for rounding differences
        amount - (installmentAmount * (installments - 1)) : 
        installmentAmount,
      dueDate,
      status: 'pending'
    });
  }
  
  return schedule;
};

/**
 * Format currency amount
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code
 * @returns {string} Formatted currency string
 */
const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

/**
 * Generate unique transaction ID
 * @returns {string} Unique transaction ID
 */
const generateTransactionId = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `TXN_${timestamp}_${random}`.toUpperCase();
};

/**
 * Calculate days between dates
 * @param {Date} date1 - First date
 * @param {Date} date2 - Second date
 * @returns {number} Number of days
 */
const daysBetween = (date1, date2) => {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round(Math.abs((date1 - date2) / oneDay));
};

/**
 * Check if date is overdue
 * @param {Date} dueDate - Due date
 * @param {Date} currentDate - Current date (defaults to now)
 * @returns {boolean} True if overdue
 */
const isOverdue = (dueDate, currentDate = new Date()) => {
  return dueDate < currentDate;
};

/**
 * Sanitize user input
 * @param {string} input - Input string
 * @returns {string} Sanitized string
 */
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/[<>"']/g, '') // Remove potentially dangerous characters
    .substring(0, 1000); // Limit length
};

/**
 * Generate pagination metadata
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {number} total - Total items
 * @returns {Object} Pagination metadata
 */
const getPaginationMeta = (page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  
  return {
    currentPage: page,
    totalPages,
    totalItems: total,
    itemsPerPage: limit,
    hasNext: page < totalPages,
    hasPrev: page > 1,
    nextPage: page < totalPages ? page + 1 : null,
    prevPage: page > 1 ? page - 1 : null
  };
};

module.exports = {
  calculateMonthlyPayment,
  generatePaymentSchedule,
  formatCurrency,
  generateTransactionId,
  daysBetween,
  isOverdue,
  sanitizeInput,
  getPaginationMeta
};