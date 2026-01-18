# Stripe Setup Guide for MegaRAG

## Overview

This guide walks you through setting up Stripe payment integration for MegaRAG. We use Stripe for subscription billing with 4 pricing tiers.

---

## Bước 1: Tạo Stripe Account

1. Truy cập [https://stripe.com](https://stripe.com)
2. Click "Start now" để đăng ký tài khoản mới (hoặc "Sign in" nếu đã có)
3. Hoàn thành verification (email, business info)
4. **QUAN TRỌNG**: Đảm bảo đang ở **Test Mode** (toggle ở góc trên bên phải)

---

## Bước 2: Lấy API Keys

1. Vào **Dashboard** → **Developers** → **API Keys**
2. Copy và lưu lại:
   - **Publishable key**: `pk_test_...` (dùng cho frontend)
   - **Secret key**: `sk_test_...` (dùng cho backend - KHÔNG được expose)

```env
# Thêm vào .env.local
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
```

---

## Bước 3: Tạo Products & Prices

Vào **Products** → **Add Product**, tạo 4 tiers sau:

### Tier 1: MegaRAG Free
> Không cần tạo trong Stripe (xử lý bằng code)

- **Price**: $0/month
- **Features**:
  - 5 documents
  - 20 queries/month
  - 50MB storage
  - Basic RAG mode only
  - Community support

### Tier 2: MegaRAG Starter

1. Click **Add Product**
2. **Name**: `MegaRAG Starter`
3. **Description**: `Perfect for individuals and small projects`
4. **Pricing**:
   - Click **Add more prices** để tạo cả Monthly và Yearly

   **Monthly:**
   - Price: `$29.00`
   - Billing period: `Monthly`
   - Save → Copy **Price ID**: `price_starter_monthly_xxx`

   **Yearly:**
   - Price: `$290.00` (2 tháng free!)
   - Billing period: `Yearly`
   - Save → Copy **Price ID**: `price_starter_yearly_xxx`

5. Copy **Product ID**: `prod_starter_xxx`

### Tier 3: MegaRAG Pro

1. Click **Add Product**
2. **Name**: `MegaRAG Pro`
3. **Description**: `Best for growing teams and businesses`
4. **Pricing**:

   **Monthly:**
   - Price: `$99.00`
   - Billing period: `Monthly`
   - Save → Copy **Price ID**: `price_pro_monthly_xxx`

   **Yearly:**
   - Price: `$990.00` (2 tháng free!)
   - Billing period: `Yearly`
   - Save → Copy **Price ID**: `price_pro_yearly_xxx`

5. Copy **Product ID**: `prod_pro_xxx`

### Tier 4: MegaRAG Business

1. Click **Add Product**
2. **Name**: `MegaRAG Business`
3. **Description**: `For large organizations with advanced needs`
4. **Pricing**:

   **Monthly:**
   - Price: `$299.00`
   - Billing period: `Monthly`
   - Save → Copy **Price ID**: `price_business_monthly_xxx`

   **Yearly:**
   - Price: `$2990.00` (2 tháng free!)
   - Billing period: `Yearly`
   - Save → Copy **Price ID**: `price_business_yearly_xxx`

5. Copy **Product ID**: `prod_business_xxx`

---

## Bước 4: Cập nhật Environment Variables

Thêm tất cả Price IDs vào `.env.local`:

```env
# Stripe Keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Stripe Price IDs - Starter
STRIPE_STARTER_MONTHLY_PRICE_ID=price_xxx
STRIPE_STARTER_YEARLY_PRICE_ID=price_xxx

# Stripe Price IDs - Pro
STRIPE_PRO_MONTHLY_PRICE_ID=price_xxx
STRIPE_PRO_YEARLY_PRICE_ID=price_xxx

# Stripe Price IDs - Business
STRIPE_BUSINESS_MONTHLY_PRICE_ID=price_xxx
STRIPE_BUSINESS_YEARLY_PRICE_ID=price_xxx
```

---

## Bước 5: Setup Webhook Endpoint

### Trong Stripe Dashboard:

1. Vào **Developers** → **Webhooks**
2. Click **Add endpoint**
3. **Endpoint URL**: `https://yourdomain.com/api/webhooks/stripe`
   - Cho local testing, dùng Stripe CLI (xem bước 6)
4. **Select events to listen to**:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
5. Click **Add endpoint**
6. Copy **Signing secret** (`whsec_xxx`) → thêm vào `STRIPE_WEBHOOK_SECRET`

---

## Bước 6: Setup Stripe CLI (Local Testing)

### Cài đặt Stripe CLI:

**Windows (với Scoop):**
```powershell
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe
```

**Windows (Manual download):**
1. Download từ [Stripe CLI Releases](https://github.com/stripe/stripe-cli/releases)
2. Giải nén và thêm vào PATH

**macOS:**
```bash
brew install stripe/stripe-cli/stripe
```

**Linux:**
```bash
# Debian/Ubuntu
curl -s https://packages.stripe.dev/api/security/keypair/stripe-cli-gpg/public | gpg --dearmor | sudo tee /usr/share/keyrings/stripe.gpg
echo "deb [signed-by=/usr/share/keyrings/stripe.gpg] https://packages.stripe.dev/stripe-cli-debian-local stable main" | sudo tee -a /etc/apt/sources.list.d/stripe.list
sudo apt update
sudo apt install stripe
```

### Login và Forward Webhooks:

```bash
# Login vào Stripe account
stripe login

# Forward webhooks đến localhost
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Terminal sẽ hiển thị webhook signing secret (whsec_xxx)
# Copy và dùng cho local testing
```

---

## Bước 7: Setup Customer Portal

1. Vào **Settings** → **Billing** → **Customer portal**
2. Click **Activate link**
3. Configure các options:
   - ✅ **Invoices**: Allow customers to view invoices
   - ✅ **Payment methods**: Allow updating payment methods
   - ✅ **Subscriptions**: Allow canceling subscriptions
   - ✅ **Subscription switching**: Allow switching between plans
4. Save changes

---

## Bước 8: Test Cards

Sử dụng các test cards sau trong Stripe Test Mode:

| Scenario | Card Number | CVC | Date |
|----------|-------------|-----|------|
| Success | `4242 4242 4242 4242` | Any 3 digits | Any future |
| Decline | `4000 0000 0000 0002` | Any 3 digits | Any future |
| Requires Auth | `4000 0025 0000 3155` | Any 3 digits | Any future |
| Insufficient Funds | `4000 0000 0000 9995` | Any 3 digits | Any future |

---

## Testing Webhooks với Stripe CLI

```bash
# Trigger specific events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.created
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
stripe trigger invoice.paid
stripe trigger invoice.payment_failed

# View webhook logs
stripe logs tail
```

---

## Checklist Hoàn Thành

- [ ] Stripe account được tạo và verified
- [ ] API Keys được lưu trong `.env.local`
- [ ] 3 Products được tạo (Starter, Pro, Business)
- [ ] 6 Prices được tạo (Monthly + Yearly cho mỗi tier)
- [ ] Webhook endpoint được configure
- [ ] Customer Portal được enable
- [ ] Stripe CLI được cài đặt và login
- [ ] Test payment thành công với card 4242...

---

## Troubleshooting

### Webhook không nhận được events

1. Kiểm tra Stripe CLI đang chạy: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
2. Kiểm tra đúng port (3000)
3. Kiểm tra `STRIPE_WEBHOOK_SECRET` match với CLI output

### Checkout session fails

1. Kiểm tra `STRIPE_SECRET_KEY` là valid
2. Kiểm tra Price ID tồn tại trong Stripe Dashboard
3. Kiểm tra user đã authenticated

### Customer Portal không mở

1. Kiểm tra Customer Portal đã được activate trong Settings
2. Kiểm tra user có Stripe Customer ID trong database

---

## Environment Variables Summary

```env
# Required for Stripe Integration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Price IDs (replace with actual values from Stripe Dashboard)
STRIPE_STARTER_MONTHLY_PRICE_ID=price_...
STRIPE_STARTER_YEARLY_PRICE_ID=price_...
STRIPE_PRO_MONTHLY_PRICE_ID=price_...
STRIPE_PRO_YEARLY_PRICE_ID=price_...
STRIPE_BUSINESS_MONTHLY_PRICE_ID=price_...
STRIPE_BUSINESS_YEARLY_PRICE_ID=price_...
```

---

## Testing Webhooks Locally

### Step 1: Install Stripe CLI

**Windows (with Scoop):**
```powershell
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe
```

**macOS:**
```bash
brew install stripe/stripe-cli/stripe
```

### Step 2: Login to Stripe CLI

```bash
stripe login
```

### Step 3: Forward webhooks to your local server

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

The CLI will display a webhook signing secret (`whsec_...`). Copy this and add it to your `.env.local`:

```env
STRIPE_WEBHOOK_SECRET=whsec_... (from CLI output)
```

### Step 4: Trigger test events

In a new terminal, trigger events:

```bash
# Checkout completed
stripe trigger checkout.session.completed

# Subscription created
stripe trigger customer.subscription.created

# Subscription updated
stripe trigger customer.subscription.updated

# Subscription deleted
stripe trigger customer.subscription.deleted

# Invoice paid
stripe trigger invoice.paid

# Invoice payment failed
stripe trigger invoice.payment_failed
```

### Step 5: Test the full flow

1. Start your local server: `npm run dev`
2. Start webhook forwarding: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
3. Go to `/pricing` and subscribe to a plan
4. Use test card: `4242 4242 4242 4242`
5. Verify:
   - Webhook events received in CLI output
   - Subscription created in database
   - User redirected to success page
   - Billing page shows correct subscription

---

## Webhook Events Reference

| Event | When it fires | What we do |
|-------|---------------|------------|
| `checkout.session.completed` | Customer completes checkout | Create/update subscription |
| `customer.subscription.created` | New subscription created | Store subscription details |
| `customer.subscription.updated` | Subscription modified | Update plan/status |
| `customer.subscription.deleted` | Subscription canceled | Downgrade to FREE |
| `invoice.paid` | Payment successful | Record invoice, reset usage |
| `invoice.payment_failed` | Payment failed | Set status to past_due |

---

## Production Webhook Setup

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Enter your production URL: `https://your-domain.com/api/webhooks/stripe`
4. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
5. Copy the signing secret and add to production environment

---

## Next Steps

After completing Stripe setup:
1. Run database migrations for subscriptions table
2. Implement checkout flow
3. Implement webhook handlers
4. Test full subscription lifecycle
