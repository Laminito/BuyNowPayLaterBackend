# Email System - Production Deployment Checklist

## Pre-Deployment Verification

### ✅ Configuration

- [ ] Gmail app password generated (not account password)
- [ ] `.env` contains all SMTP settings:
  ```env
  EMAIL_FROM=spirittechrevolution@gmail.com
  SMTP_HOST=smtp.gmail.com
  SMTP_PORT=587
  SMTP_EMAIL=spirittechrevolution@gmail.com
  SMTP_PASSWORD=alaw gudc bald yvqd
  ```
- [ ] `.env` NOT committed to git repository
- [ ] `.env` copied to production server
- [ ] EMAIL_FROM variable matches Gmail account

### ✅ Code

- [ ] `src/services/emailService.js` exists and is complete
- [ ] `src/controllers/auth.js` imports emailService
- [ ] Welcome email sent on registration
- [ ] Password reset email sent on forgot-password
- [ ] Password confirmation email sent on reset
- [ ] Password update confirmation email sent

### ✅ Dependencies

- [ ] Nodemailer installed: `npm list nodemailer`
- [ ] Correct version (6.9+ recommended)
- [ ] No dependency conflicts

### ✅ Testing

- [ ] Automated tests pass: `node scripts/test-email-service.js`
- [ ] Manual registration test completed
- [ ] Manual password reset test completed
- [ ] Emails received in test inbox
- [ ] Emails not in spam folder

### ✅ Documentation

- [ ] EMAIL_README.md written
- [ ] EMAIL_SERVICE_DOCUMENTATION.md written
- [ ] EMAIL_INTEGRATION_GUIDE.md written
- [ ] QUICK_START_EMAIL.md written
- [ ] This checklist completed

---

## Deployment Steps

### Step 1: Prepare Environment (Production Server)

```bash
# 1. Copy .env file to production
scp .env user@server:/app/BuyNowPayLaterBackend/

# 2. Set secure permissions
chmod 600 .env

# 3. Verify variables
cat .env | grep SMTP
```

### Step 2: Install Dependencies

```bash
cd /app/BuyNowPayLaterBackend
npm install nodemailer
npm install  # Install all dependencies
```

### Step 3: Verify Connection

```bash
# Start application
npm start

# Look for this in logs
✅ Email service ready and verified
```

### Step 4: Test Email Sending

```bash
# From application logs, verify:
✅ Email service ready and verified
✉️ Email sent: <messageId>
```

### Step 5: Monitor Initial Sends

```bash
# Watch server logs
tail -f logs/app.log | grep "Email\|✉️"

# Expected patterns:
✉️ Email sent: <messageId>   # Success
⚠️ Email not sent: ...       # Failure (non-blocking)
❌ Email service error: ...  # Connection error
```

---

## Post-Deployment Verification

### ✅ Smoke Tests

- [ ] Create new user account → Welcome email received
- [ ] Request password reset → Reset email received
- [ ] Click reset link → Password reset successful
- [ ] Verify reset confirmation email received
- [ ] Update password → Confirmation email received

### ✅ Monitoring

- [ ] Check application logs for email errors
- [ ] Monitor email delivery success rate
- [ ] Check email inbox for test messages
- [ ] Monitor SMTP rate limits (Gmail: ~500 emails/day)

### ✅ User Feedback

- [ ] Users receiving welcome emails
- [ ] Users receiving password reset emails
- [ ] No emails in spam folders
- [ ] Email formatting correct on mobile
- [ ] All links working correctly

---

## Troubleshooting Production Issues

### Issue: "Email service in test mode"

**Symptoms**: Emails printed to console instead of sent

**Solution**:
1. Verify `.env` has SMTP_EMAIL and SMTP_PASSWORD
2. Restart application
3. Check console for: ✅ Email service ready and verified

**Debug**:
```bash
# Check environment variables
echo $SMTP_EMAIL
echo $SMTP_PASSWORD

# Verify .env file exists
ls -la .env

# Check permissions
cat .env | grep SMTP
```

### Issue: "Email could not be sent"

**Symptoms**: Email operation fails with error message

**Causes**:
1. Gmail credentials incorrect
2. 2FA not enabled
3. App password not used
4. Network connectivity issue
5. Gmail rate limit exceeded

**Solution**:
1. Verify Gmail credentials
2. Check internet connection
3. Wait 1 hour (Gmail rate limit resets)
4. Check Gmail account for security alerts

### Issue: Email timeout

**Symptoms**: Long delay before error, then "timeout"

**Solution**:
1. Check SMTP_HOST: should be `smtp.gmail.com`
2. Check SMTP_PORT: should be `587`
3. Check firewall (port 587 must be open)
4. Check network connectivity to Gmail

### Issue: Email in spam folder

**Symptoms**: Email received but in spam/promotions

**Solution**:
1. Add sender email to contacts
2. Mark as "Not spam" in Gmail
3. Create filter rule to not spam
4. Check email authentication (SPF, DKIM, DMARC)

---

## Performance Optimization

### Recommendation: Async Email Sending

```javascript
// Don't wait for email, respond immediately
setImmediate(async () => {
  try {
    await emailService.sendWelcomeEmail(user);
  } catch (error) {
    console.log('Email error:', error.message);
  }
});

res.json({ success: true, token });
```

### Recommendation: Email Queue (Optional)

For high volume, implement queue system:

```javascript
// Using Bull + Redis
const emailQueue = new Queue('emails');

// Add to queue
await emailQueue.add({ type: 'welcome', userId });

// Process queue
emailQueue.process(async (job) => {
  const user = await User.findById(job.data.userId);
  await emailService.sendWelcomeEmail(user);
});
```

### Recommendation: Rate Limiting

```javascript
// Limit forgot-password to prevent spam
const rateLimit = require('express-rate-limit');

const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 requests per hour
  message: 'Too many password reset attempts'
});

router.post('/forgot-password', forgotPasswordLimiter, forgotPassword);
```

---

## Monitoring & Alerts

### Application Monitoring

```javascript
// Log email metrics
const emailMetrics = {
  sent: 0,
  failed: 0,
  total: 0
};

// Update metrics
try {
  await emailService.sendWelcomeEmail(user);
  emailMetrics.sent++;
} catch (error) {
  emailMetrics.failed++;
}
emailMetrics.total++;

// Log periodically
setInterval(() => {
  console.log('📊 Email Metrics:', emailMetrics);
}, 60000); // Every minute
```

### Alerting

```javascript
// Alert on high failure rate
if (emailMetrics.failed / emailMetrics.total > 0.1) {
  // Alert: More than 10% failures
  console.error('🚨 High email failure rate detected!');
  // Send alert to monitoring system
}
```

---

## Backup & Recovery

### Email Template Backup

```bash
# Backup email templates
cp src/services/emailService.js backups/emailService.js.bak
cp .env backups/.env.bak
```

### Database Logging (Optional)

Add email log collection:

```javascript
// Log each email sent
db.email_logs.insertOne({
  timestamp: new Date(),
  recipient: user.email,
  type: 'welcome',
  status: 'sent',
  messageId: result.messageId
});
```

---

## Security Checklist - Production

- [ ] `.env` file is secure (permissions 600)
- [ ] `.env` NOT in git repository (.gitignore updated)
- [ ] Gmail 2FA enabled
- [ ] Gmail app password used (not account password)
- [ ] SMTP connection uses TLS (port 587)
- [ ] Email credentials not logged to console
- [ ] Email error messages don't leak info
- [ ] Rate limiting on sensitive endpoints
- [ ] CORS properly configured for email links

---

## Rollback Plan

If email system fails in production:

### Option 1: Disable Email (Quick)

```javascript
// Temporarily disable email sending
const sendEmail = async () => {
  console.log('📧 Email sending temporarily disabled');
  return { success: true };
};
```

### Option 2: Revert Configuration

```bash
# Restore previous .env
cp backups/.env.bak .env

# Restart application
npm restart
```

### Option 3: Restore from Backup

```bash
# Restore emailService.js
cp backups/emailService.js.bak src/services/emailService.js

# Reinstall node_modules
rm -rf node_modules
npm install

# Restart
npm start
```

---

## Compliance & Legal

### GDPR Compliance

- [ ] Email sent only with user consent
- [ ] User can unsubscribe (if newsletter)
- [ ] User data not shared
- [ ] Privacy policy updated
- [ ] Cookie consent (if applicable)

### CAN-SPAM Compliance

- [ ] FROM address is honest
- [ ] Subject line is accurate
- [ ] Include physical address (optional for transactional)
- [ ] Unsubscribe link (if newsletter)

---

## Maintenance Schedule

### Daily
- [ ] Monitor email logs
- [ ] Check for delivery errors
- [ ] Verify users receiving emails

### Weekly
- [ ] Review email failure rate
- [ ] Check spam folder for emails
- [ ] Test password reset flow

### Monthly
- [ ] Audit email sending patterns
- [ ] Review user complaints
- [ ] Update email templates if needed
- [ ] Verify SMTP connection still working

### Quarterly
- [ ] Review Gmail app password (refresh if needed)
- [ ] Update documentation
- [ ] Security audit
- [ ] Performance review

---

## Success Criteria

✅ **System is Production Ready when:**

1. **Configuration**
   - ✅ All SMTP variables set in .env
   - ✅ Gmail credentials verified
   - ✅ .env secure and not in git

2. **Functionality**
   - ✅ All emails sending successfully
   - ✅ Email templates rendering correctly
   - ✅ Links working properly
   - ✅ No emails in spam

3. **Reliability**
   - ✅ Error handling in place
   - ✅ No unhandled exceptions
   - ✅ Graceful failures
   - ✅ Logging working

4. **Security**
   - ✅ TLS encryption enabled
   - ✅ Credentials protected
   - ✅ Rate limiting implemented
   - ✅ CORS configured

5. **Monitoring**
   - ✅ Email logs recorded
   - ✅ Error alerts configured
   - ✅ Metrics being tracked
   - ✅ Dashboard available

---

## Final Checklist

Before going live:

- [ ] All tests passing
- [ ] Documentation complete
- [ ] Team trained on email system
- [ ] Monitoring set up
- [ ] Backup procedures documented
- [ ] Rollback plan ready
- [ ] Performance acceptable
- [ ] Security audit passed
- [ ] User acceptance testing done
- [ ] Go/No-Go decision made

---

## Sign-Off

- [ ] Development: _________________ Date: _______
- [ ] Testing: _________________ Date: _______
- [ ] Deployment: _________________ Date: _______
- [ ] Operations: _________________ Date: _______

---

*Document: Email System Production Deployment Checklist*
*Version: 1.0 | Date: 2025 | Status: Ready*
