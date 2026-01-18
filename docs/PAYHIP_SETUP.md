# Payhip Setup Guide for MegaRAG

## Overview

Payhip is a digital goods marketplace that supports:
- **Vietnamese credit/debit cards** (works immediately!)
- **PayPal** (worldwide)
- **International credit cards** (Visa, Mastercard, etc.)

This makes Payhip ideal for accepting payments from Vietnam users while Stripe approval is pending.

---

## Why Payhip?

| Feature | Payhip | Stripe |
|---------|--------|--------|
| VN cards | ✅ Works | ⏳ Requires approval |
| PayPal | ✅ Built-in | ❌ Separate integration |
| Setup time | Minutes | Days/Weeks |
| Fee | 5% + payment fees | 2.9% + 30¢ |
| Subscription | ✅ Membership products | ✅ Native |

**Strategy**: Use Payhip now, enable Stripe when approved.

---

## Step 1: Create Payhip Account

1. Go to [https://payhip.com](https://payhip.com)
2. Click "Start Selling"
3. Complete account setup:
   - Business name
   - Email
   - Payment details (PayPal or bank)
4. Verify email

---

## Step 2: Create Membership Products (6 Total)

For each pricing tier, create TWO products (monthly + yearly):

### Product 1: MegaRAG Starter Monthly
1. Go to **Products** → **Add Product**
2. Product type: **Membership** (recurring)
3. Fill details:
   - **Name**: `MegaRAG Starter Monthly`
   - **Price**: `$29.00`
   - **Billing frequency**: `Monthly`
   - **Description**:
     ```
     MegaRAG Starter Plan - Monthly Subscription
     - 50 documents
     - 500 queries/month
     - 1GB storage
     - All RAG modes
     - Email support
     ```
4. Save and copy the **Product Link** (e.g., `https://payhip.com/b/XXXXX`)

### Product 2: MegaRAG Starter Yearly
- Same as above but:
  - **Name**: `MegaRAG Starter Yearly`
  - **Price**: `$290.00`
  - **Billing frequency**: `Yearly`

### Product 3: MegaRAG Pro Monthly
- **Name**: `MegaRAG Pro Monthly`
- **Price**: `$99.00`
- **Billing frequency**: `Monthly`

### Product 4: MegaRAG Pro Yearly
- **Name**: `MegaRAG Pro Yearly`
- **Price**: `$990.00`
- **Billing frequency**: `Yearly`

### Product 5: MegaRAG Business Monthly
- **Name**: `MegaRAG Business Monthly`
- **Price**: `$299.00`
- **Billing frequency**: `Monthly`

### Product 6: MegaRAG Business Yearly
- **Name**: `MegaRAG Business Yearly`
- **Price**: `$2990.00`
- **Billing frequency**: `Yearly`

---

## Step 3: Configure Webhooks

1. Go to **Settings** → **Webhooks**
2. Click **Add Webhook**
3. Enter:
   - **URL**: `https://your-domain.com/api/webhooks/payhip`
   - For local testing: Use ngrok or similar
4. Select events:
   - ✅ `subscription:created`
   - ✅ `subscription:renewed`
   - ✅ `subscription:cancelled`
   - ✅ `subscription:expired`
   - ✅ `payment:completed`
   - ✅ `payment:refunded`
5. Save and note the webhook signing secret (if provided)

### Local Webhook Testing

Since Payhip can't reach localhost, use ngrok:

```bash
# Install ngrok
npm install -g ngrok

# Start tunnel
ngrok http 3000

# Use the ngrok URL for webhook
# Example: https://abc123.ngrok.io/api/webhooks/payhip
```

---

## Step 4: Configure Environment Variables

Add to your `.env.local`:

```env
# Enable Payhip (disable Stripe for now)
NEXT_PUBLIC_PAYHIP_ENABLED=true
NEXT_PUBLIC_STRIPE_ENABLED=false

# Payhip Product URLs (from Step 2)
PAYHIP_STARTER_MONTHLY_URL=https://payhip.com/b/XXXXX
PAYHIP_STARTER_YEARLY_URL=https://payhip.com/b/XXXXX
PAYHIP_PRO_MONTHLY_URL=https://payhip.com/b/XXXXX
PAYHIP_PRO_YEARLY_URL=https://payhip.com/b/XXXXX
PAYHIP_BUSINESS_MONTHLY_URL=https://payhip.com/b/XXXXX
PAYHIP_BUSINESS_YEARLY_URL=https://payhip.com/b/XXXXX

# Payhip Webhook Secret (if provided)
PAYHIP_WEBHOOK_SECRET=xxx
```

---

## Step 5: Run Database Migration

Run in Supabase SQL Editor:

```sql
-- Add Payhip columns to subscriptions
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS payhip_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS payhip_license_key TEXT,
ADD COLUMN IF NOT EXISTS payment_provider TEXT DEFAULT 'stripe';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_payhip_sub
ON subscriptions(payhip_subscription_id)
WHERE payhip_subscription_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_subscriptions_provider
ON subscriptions(payment_provider);

-- Add email to profiles for webhook matching
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS email TEXT;

-- Copy emails from auth.users
UPDATE profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id
AND (p.email IS NULL OR p.email = '');

CREATE INDEX IF NOT EXISTS idx_profiles_email
ON profiles(email)
WHERE email IS NOT NULL;
```

---

## Step 6: Test the Integration

### Test Flow:

1. Start dev server: `npm run dev`
2. Go to `/pricing`
3. Select a paid plan
4. If both providers enabled, you'll see payment method selector
5. Choose "Payhip"
6. Complete purchase with test info:
   - Email: Your test email
   - Card: Any valid card (Payhip uses real payments in sandbox)
7. Verify:
   - Webhook received in your logs
   - Subscription created in database
   - User redirected to success page

### Check Webhook Logs:

```bash
# View logs in terminal
npm run dev

# Look for:
# "Payhip webhook received: {...}"
# "Subscription created for user xxx"
```

---

## Step 7: Production Deployment

### Vercel/Production:

1. Add all env vars to Vercel dashboard
2. Update webhook URL to production domain
3. Test with real purchase (you can refund yourself)

### DNS/Domain:

Ensure your production domain is verified and accessible.

---

## Enabling Both Providers

To offer customers a choice:

```env
NEXT_PUBLIC_PAYHIP_ENABLED=true
NEXT_PUBLIC_STRIPE_ENABLED=true
```

When both are enabled:
- Users see a modal to choose payment method
- Payhip: VN cards, PayPal
- Stripe: International cards

---

## Webhook Events Reference

| Event | Description | Action |
|-------|-------------|--------|
| `subscription:created` | New subscription | Create subscription record |
| `subscription:renewed` | Recurring payment successful | Update period dates |
| `subscription:cancelled` | User cancelled | Set status to canceled |
| `subscription:expired` | Subscription ended | Downgrade to FREE |
| `payment:completed` | One-time payment | Create/update subscription |
| `payment:refunded` | Refund processed | Cancel subscription |

---

## Troubleshooting

### "User not found" in webhook logs

The user must exist in your database BEFORE purchasing. Solutions:
1. Require login before checkout (current flow does this)
2. Add email to profiles table for matching

### Webhook not received

1. Check ngrok tunnel is running (for local)
2. Verify webhook URL is correct in Payhip
3. Check Payhip webhook logs in their dashboard

### Subscription not activating

1. Check browser console for errors
2. Verify Supabase service role key is set
3. Check database RLS policies

### Product URL 404

The product might be:
- Set to draft (publish it)
- Deleted (recreate it)
- Wrong URL (copy from Payhip dashboard)

---

## Pricing Summary

| Plan | Monthly | Yearly (Save 17%) |
|------|---------|-------------------|
| Starter | $29 | $290 |
| Pro | $99 | $990 |
| Business | $299 | $2,990 |

---

## Customer Support Flow

When a customer needs to manage their subscription:

1. **Cancel/Modify**: Direct them to Payhip dashboard
2. **Refunds**: Process through Payhip
3. **Invoice**: Payhip sends automatic receipts

Unlike Stripe, Payhip doesn't have a customer portal API, so subscription management happens on Payhip's site.

---

## Security Notes

1. **Webhook verification**: Payhip webhook security is limited. Consider:
   - IP allowlisting if Payhip provides IPs
   - Rate limiting webhook endpoint
   - Validating passthrough data

2. **User matching**: Always match users by:
   - Passthrough data (userId) - preferred
   - Email - fallback
   - Never by name alone

---

## Next Steps

After Payhip is working:

1. Apply for Stripe approval
2. When approved, add Stripe env vars
3. Set `NEXT_PUBLIC_STRIPE_ENABLED=true`
4. Users can then choose their preferred payment method

---

## Files Reference

| File | Purpose |
|------|---------|
| `src/lib/payhip/config.ts` | Payhip configuration |
| `src/lib/payhip/client.ts` | Checkout URL builder |
| `src/lib/payments/index.ts` | Unified payment service |
| `src/app/api/payhip/checkout/route.ts` | Checkout API |
| `src/app/api/webhooks/payhip/route.ts` | Webhook handler |
| `supabase/migrations/003_add_payhip_columns.sql` | DB migration |
