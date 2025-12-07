#!/usr/bin/env node

/**
 * Email Service Testing Script
 * Tests all email functionality without sending actual emails
 * 
 * Usage: node scripts/test-email-service.js
 */

const emailService = require('../src/services/emailService');

// Mock user data
const mockUser = {
  _id: '6565a1b2c3d4e5f6g7h8i9j0',
  email: 'test@example.com',
  name: 'Test User',
  firstName: 'Test',
  lastName: 'User',
  role: 'user',
  creditLimit: 100000
};

// Mock order data
const mockOrder = {
  _id: '6565a1b2c3d4e5f6g7h8i9j1',
  items: [
    {
      productId: { name: 'Product 1' },
      quantity: 2,
      price: 5000
    },
    {
      productId: { name: 'Product 2' },
      quantity: 1,
      price: 10000
    }
  ],
  totalAmount: 20000,
  status: 'pending',
  payment: {
    method: 'kredika',
    status: 'waiting',
    kredika: {
      reservationId: 'KRD-2025-12345',
      authorizationCode: 'AUTH-123456'
    }
  },
  createdAt: new Date(),
  tracking: {
    carrier: 'DHL',
    trackingNumber: 'DHL-2025-98765',
    estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
  }
};

// Test data
let testsPassed = 0;
let testsFailed = 0;

/**
 * Run a test
 */
async function runTest(name, testFn) {
  try {
    console.log(`\n✓ Testing: ${name}`);
    await testFn();
    console.log(`  ✅ PASSED`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAILED: ${error.message}`);
    testsFailed++;
  }
}

/**
 * Main test suite
 */
async function runTests() {
  console.log('\n' + '='.repeat(60));
  console.log('📧 EMAIL SERVICE TEST SUITE');
  console.log('='.repeat(60));

  // Test 1: Welcome Email
  await runTest('sendWelcomeEmail()', async () => {
    const result = await emailService.sendWelcomeEmail(mockUser);
    if (!result || !result.success) {
      throw new Error('Failed to send welcome email');
    }
  });

  // Test 2: Password Reset Email
  await runTest('sendPasswordResetEmail()', async () => {
    const resetToken = 'test-reset-token-12345';
    const result = await emailService.sendPasswordResetEmail(mockUser, resetToken);
    if (!result || !result.success) {
      throw new Error('Failed to send password reset email');
    }
  });

  // Test 3: Order Confirmation Email
  await runTest('sendOrderConfirmationEmail()', async () => {
    const result = await emailService.sendOrderConfirmationEmail(mockOrder, mockUser);
    if (!result || !result.success) {
      throw new Error('Failed to send order confirmation email');
    }
  });

  // Test 4: Payment Status Email - Confirmed
  await runTest('sendPaymentStatusEmail() - confirmed', async () => {
    const result = await emailService.sendPaymentStatusEmail(mockOrder, mockUser, 'confirmed');
    if (!result || !result.success) {
      throw new Error('Failed to send payment confirmation email');
    }
  });

  // Test 5: Payment Status Email - Failed
  await runTest('sendPaymentStatusEmail() - failed', async () => {
    const result = await emailService.sendPaymentStatusEmail(mockOrder, mockUser, 'failed');
    if (!result || !result.success) {
      throw new Error('Failed to send payment failed email');
    }
  });

  // Test 6: Payment Status Email - Pending
  await runTest('sendPaymentStatusEmail() - pending', async () => {
    const result = await emailService.sendPaymentStatusEmail(mockOrder, mockUser, 'pending');
    if (!result || !result.success) {
      throw new Error('Failed to send payment pending email');
    }
  });

  // Test 7: Shipping Notification Email
  await runTest('sendShippingNotificationEmail()', async () => {
    const result = await emailService.sendShippingNotificationEmail(mockOrder, mockUser);
    if (!result || !result.success) {
      throw new Error('Failed to send shipping notification email');
    }
  });

  // Test 8: Verification Email
  await runTest('sendVerificationEmail()', async () => {
    const verificationToken = 'verify-token-12345';
    const result = await emailService.sendVerificationEmail(mockUser, verificationToken);
    if (!result || !result.success) {
      throw new Error('Failed to send verification email');
    }
  });

  // Test 9: Generic Send Email
  await runTest('sendEmail() - custom email', async () => {
    const result = await emailService.sendEmail(
      mockUser.email,
      'Test Subject',
      '<html><body>Test HTML Content</body></html>',
      'Test plain text content'
    );
    if (!result || !result.success) {
      throw new Error('Failed to send custom email');
    }
  });

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${testsPassed}`);
  console.log(`❌ Failed: ${testsFailed}`);
  console.log(`📧 Total: ${testsPassed + testsFailed}`);
  console.log('='.repeat(60) + '\n');

  // Exit with appropriate code
  process.exit(testsFailed > 0 ? 1 : 0);
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { runTests };
