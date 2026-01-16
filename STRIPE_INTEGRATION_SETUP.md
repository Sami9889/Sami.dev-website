# Stripe & Email Integration Setup Guide

## What's Been Implemented

### 1. **Fixed Card Overlapping Issue** ✅
- Updated CSS grid layout with `grid-auto-rows: max-content` 
- Improved gap spacing to `1.5rem`
- Added proper card height with `height: 100%`
- Added hover effects for better UX

### 2. **Stripe Payment Integration** ✅
- Added Stripe library to dependencies (`stripe` & `nodemailer` packages)
- Created `/api/stripe/create-payment-intent` endpoint for payment processing
- Added Stripe payment form with card element to checkout
- Integrated `stripe.confirmCardPayment()` in frontend for secure payments
- Webhook endpoint ready for payment confirmation events

### 3. **Email Confirmations** ✅
- Email sent automatically after successful order placement
- Beautiful HTML email template with order details
- Includes: Order ID, items, shipping address, total amount
- Configured via environment variables (Gmail recommended)

### 4. **Improved Checkout Form** ✅
- Added fields: First/Last Name, Country, State
- Stripe Card Element for secure card handling
- Real-time validation error messages
- Better form layout with grid columns
- Improved styling and accessibility

## Setup Instructions

### Step 1: Install Dependencies
```bash
cd /workspaces/Sami.dev-website
npm install
```

### Step 2: Get Stripe Keys
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers** → **API Keys**
3. Copy your **Publishable Key** (starts with `pk_live_` or `pk_test_`)
4. Copy your **Secret Key** (starts with `sk_live_` or `sk_test_`)

### Step 3: Configure Environment
Copy `.env.example` to `.env` and fill in:

```env
# Stripe (REQUIRED for payments)
STRIPE_SECRET_KEY=sk_live_your_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_live_your_publishable_key_here

# Email Configuration (for order confirmations)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Printify (existing setup)
PRINTIFY_TOKEN=your_token
SHOP_ID=your_shop_id
```

### Step 4: Email Configuration (Gmail Example)
1. Enable 2-Factor Authentication on your Gmail account
2. Go to [App Passwords](https://myaccount.google.com/apppasswords)
3. Generate an app-specific password for your app
4. Use that password in `.env` as `EMAIL_PASSWORD`

### Step 5: Run the Server
```bash
npm start
# Server runs on http://localhost:3000
```

## Files Modified

- **[.env.example](.env.example)** - Added Stripe & email config variables
- **[package.json](package.json)** - Added `stripe` & `nodemailer` dependencies
- **[merch.html](merch.html)** - Enhanced checkout form, improved card CSS
- **[server.js](server.js)** - Added payment & email endpoints
- **[assets/merch.js](assets/merch.js)** - Added Stripe payment processing

## Payment Flow

```
User fills checkout form
        ↓
Stripe creates payment intent
        ↓
User enters card details
        ↓
Stripe processes payment
        ↓
If successful: Create Printify order
        ↓
Send confirmation email
        ↓
Display success message
```

## Testing

### Test Mode
- Use Stripe test keys (starting with `pk_test_` and `sk_test_`)
- Test card: `4242 4242 4242 4242`, any future date, any CVC
- No real charges made

### Production Mode
- Replace with live keys (`pk_live_` and `sk_live_`)
- Real payments will be processed
- ⚠️ **NEVER commit live keys to git!**

## API Endpoints

### New Endpoints
- `POST /api/stripe/create-payment-intent` - Create Stripe payment intent
- `POST /api/stripe/webhook` - Stripe webhook for payment confirmations

### Updated Endpoints
- `POST /api/checkout` - Now sends order confirmation emails
- `GET /api/config` - Returns Stripe configuration status

## Security Notes

✅ **Best Practices Implemented:**
- Stripe payment processing on frontend (never store card data on server)
- Secret keys stored in environment variables only
- Email credentials never exposed to frontend
- HTTPS recommended for production

⚠️ **Remember:**
- Never commit `.env` file to git
- Use `.env.example` to document required variables
- Regenerate Stripe keys if accidentally exposed
- Use environment-specific keys (test vs production)

## Troubleshooting

### Email Not Sending?
- Check `EMAIL_SERVICE`, `EMAIL_USER`, `EMAIL_PASSWORD` are set
- For Gmail: Use app-specific password, not your account password
- Check spam folder

### Stripe Errors?
- Verify keys are correct and in `.env`
- Check Stripe dashboard for failed payment attempts
- Ensure `STRIPE_PUBLISHABLE_KEY` is returned from `/api/config`

### Card Form Not Showing?
- Ensure Stripe script loaded: `<script src="https://js.stripe.com/v3/"></script>`
- Check browser console for errors
- Verify `CONFIG.stripeConfigured === true`

## Next Steps

1. ✅ Replace test Stripe keys with production keys
2. ✅ Set up proper email sender address
3. ✅ Configure PRINTIFY_TOKEN & SHOP_ID for live products
4. ✅ Test order flow end-to-end
5. ✅ Deploy to production with HTTPS
6. ✅ Set up Stripe webhook for payment confirmations
7. ✅ Monitor Sentry metrics for errors

---

**Questions?** Check Stripe docs at https://stripe.com/docs or Printify docs at https://printify.com/api
