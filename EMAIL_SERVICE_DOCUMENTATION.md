# Email Service Documentation

## Overview

The Email Service provides automated email sending functionality for the Buy Now Pay Later backend using Nodemailer with Gmail SMTP configuration.

## Configuration

### Environment Variables

The email service uses the following environment variables from `.env`:

```env
EMAIL_FROM=spirittechrevolution@gmail.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=spirittechrevolution@gmail.com
SMTP_PASSWORD=alaw gudc bald yvqd
```

**IMPORTANT**: The SMTP_PASSWORD is an "App Password" for Gmail, not your regular Gmail password.

### How to Generate Gmail App Password

1. Go to https://myaccount.google.com/
2. Navigate to "Security" in the left menu
3. Scroll down to "App passwords" (only visible if 2FA is enabled)
4. Select "Mail" and "Windows Computer"
5. Copy the generated 16-character password
6. Add it to `.env` as `SMTP_PASSWORD`

## Service Location

`src/services/emailService.js`

## Email Methods

### 1. sendWelcomeEmail(user)
Sends a welcome email when a new user registers.

**Parameters:**
- `user` (Object): User object with `email`, `firstName`, `name`, `role`, `creditLimit`

**Usage:**
```javascript
const emailService = require('../services/emailService');
await emailService.sendWelcomeEmail(user);
```

**Example Response:**
```
Subject: Bienvenue sur Buy Now Pay Later!
- Welcome message
- User account information
- Link to dashboard
```

---

### 2. sendPasswordResetEmail(user, resetToken)
Sends password reset email with reset link.

**Parameters:**
- `user` (Object): User object with `email`, `firstName`, `name`
- `resetToken` (String): Reset token from user.getResetPasswordToken()

**Usage:**
```javascript
await emailService.sendPasswordResetEmail(user, resetToken);
```

**Example Response:**
```
Subject: Réinitialiser votre mot de passe Buy Now Pay Later
- Reset link that expires in 10 minutes
- Security warning about link expiration
- Instructions to contact support
```

---

### 3. sendOrderConfirmationEmail(order, user)
Sends order confirmation with order details.

**Parameters:**
- `order` (Object): Order object with `_id`, `items`, `totalAmount`, `payment`, `status`
- `user` (Object): User object with `email`, `firstName`, `name`

**Usage:**
```javascript
await emailService.sendOrderConfirmationEmail(order, user);
```

**Example Response:**
```
Subject: Commande confirmée - #{order._id}
- Order ID and date
- Item details with quantities and prices
- Payment method (Kredika or Card)
- Order total
```

---

### 4. sendPaymentStatusEmail(order, user, status)
Sends payment status update for Kredika transactions.

**Parameters:**
- `order` (Object): Order object with `_id`, `totalAmount`, `payment`
- `user` (Object): User object with `email`, `firstName`, `name`
- `status` (String): One of: `confirmed`, `paid`, `failed`, `pending`, `waiting`

**Usage:**
```javascript
await emailService.sendPaymentStatusEmail(order, user, 'confirmed');
```

**Example Responses:**
```
Status: confirmed/paid
Subject: Paiement confirmé - Buy Now Pay Later
- Success message
- Kredika reference number
- Order tracking link

Status: failed
Subject: Paiement échoué - Action requise
- Error message
- Action items
- Support contact information

Status: pending/waiting
Subject: Paiement en attente - Buy Now Pay Later
- Processing message
- Estimated time
```

---

### 5. sendShippingNotificationEmail(order, user)
Sends shipping notification with tracking information.

**Parameters:**
- `order` (Object): Order object with `_id`, `tracking` (carrier, trackingNumber, estimatedDelivery)
- `user` (Object): User object with `email`, `firstName`, `name`

**Usage:**
```javascript
await emailService.sendShippingNotificationEmail(order, user);
```

**Example Response:**
```
Subject: Votre commande est expédiée - #{order._id}
- Carrier information
- Tracking number
- Estimated delivery date
- Link to order tracking
```

---

### 6. sendVerificationEmail(user, verificationToken)
Sends email verification link.

**Parameters:**
- `user` (Object): User object with `email`, `firstName`, `name`
- `verificationToken` (String): Verification token

**Usage:**
```javascript
await emailService.sendVerificationEmail(user, verificationToken);
```

**Example Response:**
```
Subject: Vérifiez votre adresse email
- Verification link
- Instructions
```

---

### 7. sendEmail(to, subject, html, text)
Generic email sending method for custom emails.

**Parameters:**
- `to` (String): Recipient email address
- `subject` (String): Email subject
- `html` (String): HTML content
- `text` (String, optional): Plain text content

**Usage:**
```javascript
await emailService.sendEmail(
  'user@example.com',
  'Custom Subject',
  '<html>...</html>',
  'Plain text version'
);
```

---

## Integration with Authentication

### Register Flow
```javascript
const register = async (req, res, next) => {
  // ... create user ...
  const user = await User.create({...});
  
  // Send welcome email
  try {
    await emailService.sendWelcomeEmail(user);
  } catch (emailError) {
    console.log('Email not sent:', emailError.message);
    // Continue anyway
  }
  
  sendTokenResponse(user, 201, res);
};
```

### Forgot Password Flow
```javascript
const forgotPassword = async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });
  
  // Send reset email
  try {
    await emailService.sendPasswordResetEmail(user, resetToken);
    res.status(200).json({
      success: true,
      message: 'Email sent with reset token'
    });
  } catch (emailError) {
    // Clear token and return error
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    
    return res.status(500).json({
      success: false,
      error: 'Email could not be sent'
    });
  }
};
```

### Reset Password Flow
```javascript
const resetPassword = async (req, res, next) => {
  // ... validate and reset password ...
  
  // Send confirmation email
  try {
    await emailService.sendEmail(
      user.email,
      'Mot de passe réinitialisé avec succès',
      '<html>...</html>',
      'Password reset successfully'
    );
  } catch (emailError) {
    console.log('Confirmation email not sent');
  }
  
  sendTokenResponse(user, 200, res);
};
```

---

## Error Handling

The email service has built-in error handling:

1. **Connection Errors**: Logs error and sets test mode
2. **Send Errors**: Logs error, throws exception to caller
3. **Test Mode**: If SMTP not configured, logs emails to console

### Example Error Handling:
```javascript
try {
  await emailService.sendPasswordResetEmail(user, resetToken);
} catch (error) {
  console.error('Email sending failed:', error.message);
  // Handle error appropriately
  return res.status(500).json({
    success: false,
    error: 'Email could not be sent'
  });
}
```

---

## Testing

### Test with Console Logging
To test without actual SMTP, the service logs to console:

```javascript
// If SMTP not configured, logs appear as:
// 📧 [TEST MODE] Email to user@example.com:
// Subject: Test Subject
// Content: HTML/Text content
```

### Test Actual Email Sending
```bash
# 1. Configure .env with Gmail credentials
# 2. Start the server
npm run dev

# 3. Call the endpoint
POST /api/v1/auth/forgot-password
{
  "email": "test@example.com"
}

# Check console for:
# ✅ Email service ready and verified
# ✉️ Email sent: <messageId>
```

---

## Security Notes

1. **Never commit SMTP_PASSWORD** to version control
2. **Use App Password** (not regular Gmail password)
3. **Email tokens expire** in 10 minutes (configurable)
4. **HTML sanitization** recommended for user-generated content
5. **Rate limiting** recommended for forgot-password endpoint

---

## Troubleshooting

### Issue: "Email service in test mode"
**Solution**: Check if SMTP_EMAIL and SMTP_PASSWORD are set in .env

### Issue: "Email could not be sent"
**Solution**: 
1. Verify Gmail credentials in .env
2. Check if 2FA is enabled and app password is used
3. Verify SMTP_PORT=587 (not 465)
4. Check internet connection

### Issue: "Invalid or expired token"
**Solution**: Email reset token expires in 10 minutes. User must request new reset.

### Issue: "Email not received in Gmail"
**Solution**:
1. Check spam folder
2. Verify recipient email address
3. Check Gmail security settings
4. Review SMTP logs for errors

---

## Email Templates

All email templates are embedded in `emailService.js` with:
- HTML templates with inline CSS
- Responsive design
- Professional styling
- Fallback plain text

### Template Structure
- Header with branding
- Content section with main message
- Call-to-action buttons
- Footer with copyright

---

## Future Enhancements

1. Separate template files (Handlebars, EJS)
2. Email analytics tracking
3. Unsubscribe management
4. Newsletter functionality
5. Email scheduling
6. Multiple sender addresses
7. Attachment support

---

## Files Modified

- `src/services/emailService.js` - Email service implementation
- `src/controllers/auth.js` - Integration with authentication endpoints
- `.env` - Gmail SMTP configuration

## Related Documentation

- [Authentication API](./BACKEND_API_COMPLETE.md)
- [User Management](./USERS_API.md)
- [Swagger Documentation](http://localhost:3000/api/docs)
