# PHASE A2: PAYMENT INTEGRATION (STRIPE)

## Thời gian: Day 6-10
## Mục tiêu: Implement subscription payment với Stripe

---

## TỔNG QUAN PHASE A2

```
Day 6: Stripe Setup & Configuration
Day 7: Database Schema cho Subscriptions
Day 8: Checkout Flow Implementation
Day 9: Subscription Management
Day 10: Webhook Handlers
```

---

## DAY 6: STRIPE SETUP & CONFIGURATION

### PROMPT 6.1 - Stripe Account & Products Setup

```
Tạo file hướng dẫn `docs/STRIPE_SETUP.md`:

# Stripe Setup Guide

## Bước 1: Tạo Stripe Account
1. Truy cập https://stripe.com
2. Đăng ký tài khoản (hoặc login)
3. Vào Dashboard → Developers → API Keys
4. Lưu lại:
   - Publishable key (pk_test_xxx)
   - Secret key (sk_test_xxx)

## Bước 2: Tạo Products & Prices

Vào Products → Add Product, tạo 4 tiers:

### Tier 1: Free
- Name: MegaRAG Free
- Pricing: $0/month
- Features: 5 docs, 20 queries, 50MB storage

### Tier 2: Starter
- Name: MegaRAG Starter
- Pricing: $29/month (Monthly) hoặc $290/year (Yearly)
- Product ID: prod_starter_xxx
- Price IDs: price_starter_monthly_xxx, price_starter_yearly_xxx

### Tier 3: Pro
- Name: MegaRAG Pro
- Pricing: $99/month hoặc $990/year
- Product ID: prod_pro_xxx
- Price IDs: price_pro_monthly_xxx, price_pro_yearly_xxx

### Tier 4: Business
- Name: MegaRAG Business
- Pricing: $299/month hoặc $2990/year
- Product ID: prod_business_xxx
- Price IDs: price_business_monthly_xxx, price_business_yearly_xxx

## Bước 3: Setup Webhook
1. Vào Developers → Webhooks
2. Add endpoint: https://yourdomain.com/api/webhooks/stripe
3. Select events:
   - checkout.session.completed
   - customer.subscription.created
   - customer.subscription.updated
   - customer.subscription.deleted
   - invoice.paid
   - invoice.payment_failed
4. Lưu Webhook Secret (whsec_xxx)

## Bước 4: Customer Portal
1. Vào Settings → Billing → Customer Portal
2. Enable features:
   - Invoices
   - Update payment method
   - Cancel subscription
   - Switch plans

Hãy tạo file này với đầy đủ hướng dẫn.
```

### PROMPT 6.2 - Install & Configure Stripe

```
Setup Stripe trong project:

1. Cài đặt dependencies:
```bash
npm install stripe @stripe/stripe-js
```

2. Tạo file `src/lib/stripe/config.ts`:
```typescript
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
  typescript: true,
})

export const PLANS = {
  FREE: {
    name: 'Free',
    price: 0,
    priceId: null,
    limits: {
      documents: 5,
      queries: 20,
      storage: 50 * 1024 * 1024, // 50MB
    },
    features: [
      '5 documents',
      '20 queries/month',
      '50MB storage',
      'Basic RAG mode only',
      'Community support',
    ],
  },
  STARTER: {
    name: 'Starter',
    price: 29,
    priceIdMonthly: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID,
    priceIdYearly: process.env.STRIPE_STARTER_YEARLY_PRICE_ID,
    limits: {
      documents: 50,
      queries: 500,
      storage: 1024 * 1024 * 1024, // 1GB
    },
    features: [
      '50 documents',
      '500 queries/month',
      '1GB storage',
      'All 5 RAG modes',
      'Knowledge graph',
      'Email support',
    ],
  },
  PRO: {
    name: 'Pro',
    price: 99,
    priceIdMonthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
    priceIdYearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID,
    limits: {
      documents: 500,
      queries: 5000,
      storage: 10 * 1024 * 1024 * 1024, // 10GB
    },
    features: [
      '500 documents',
      '5,000 queries/month',
      '10GB storage',
      'All features',
      'API access',
      'Priority support',
      'Custom branding',
    ],
  },
  BUSINESS: {
    name: 'Business',
    price: 299,
    priceIdMonthly: process.env.STRIPE_BUSINESS_MONTHLY_PRICE_ID,
    priceIdYearly: process.env.STRIPE_BUSINESS_YEARLY_PRICE_ID,
    limits: {
      documents: 2000,
      queries: 20000,
      storage: 50 * 1024 * 1024 * 1024, // 50GB
    },
    features: [
      '2,000 documents',
      '20,000 queries/month',
      '50GB storage',
      'All features',
      'Team members (up to 10)',
      'Advanced analytics',
      'Webhook integrations',
      'Dedicated support',
    ],
  },
}
```

3. Update `.env.local`:
```env
STRIPE_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_STARTER_MONTHLY_PRICE_ID=price_xxx
STRIPE_STARTER_YEARLY_PRICE_ID=price_xxx
STRIPE_PRO_MONTHLY_PRICE_ID=price_xxx
STRIPE_PRO_YEARLY_PRICE_ID=price_xxx
STRIPE_BUSINESS_MONTHLY_PRICE_ID=price_xxx
STRIPE_BUSINESS_YEARLY_PRICE_ID=price_xxx
```

4. Tạo file `src/lib/stripe/client.ts` cho frontend:
```typescript
import { loadStripe } from '@stripe/stripe-js'

export const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
)
```
```

---

## DAY 7: DATABASE SCHEMA CHO SUBSCRIPTIONS

### PROMPT 7.1 - Tạo Subscription Tables

```
Tạo migration cho subscription tables:

File: `supabase/migrations/002_subscriptions.sql`

```sql
-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,
  plan_name TEXT NOT NULL DEFAULT 'FREE',
  status TEXT NOT NULL DEFAULT 'active', -- active, canceled, past_due, trialing
  billing_cycle TEXT DEFAULT 'monthly', -- monthly, yearly
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Usage tracking table
CREATE TABLE IF NOT EXISTS usage_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  documents_count INTEGER DEFAULT 0,
  queries_count INTEGER DEFAULT 0,
  storage_bytes BIGINT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, period_start)
);

-- Invoices table (for record keeping)
CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  stripe_invoice_id TEXT UNIQUE,
  amount_paid INTEGER, -- in cents
  currency TEXT DEFAULT 'usd',
  status TEXT, -- paid, open, void, uncollectible
  invoice_pdf TEXT,
  hosted_invoice_url TEXT,
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  USING (user_id = auth.uid() OR organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can view own usage"
  ON usage_records FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can view own invoices"
  ON invoices FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

-- Indexes
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_org_id ON subscriptions(organization_id);
CREATE INDEX idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX idx_usage_records_org_period ON usage_records(organization_id, period_start);
```

Chạy migration và verify tables được tạo.
```

### PROMPT 7.2 - Tạo Subscription Service

```
Tạo service để manage subscriptions:

File: `src/services/subscriptionService.ts`

```typescript
import { stripe, PLANS } from '@/lib/stripe/config'
import { createClient } from '@/lib/supabase/server'

export class SubscriptionService {
  // Get or create Stripe customer
  async getOrCreateCustomer(userId: string, email: string): Promise<string>
  
  // Create checkout session
  async createCheckoutSession(params: {
    customerId: string
    priceId: string
    successUrl: string
    cancelUrl: string
  }): Promise<string>
  
  // Create customer portal session
  async createPortalSession(customerId: string, returnUrl: string): Promise<string>
  
  // Get subscription by user/org
  async getSubscription(organizationId: string): Promise<Subscription | null>
  
  // Update subscription in database
  async updateSubscription(stripeSubscriptionId: string, data: Partial<Subscription>): Promise<void>
  
  // Cancel subscription
  async cancelSubscription(subscriptionId: string): Promise<void>
  
  // Check if user can perform action based on limits
  async checkUsageLimits(organizationId: string, action: 'document' | 'query'): Promise<{
    allowed: boolean
    current: number
    limit: number
    message?: string
  }>
  
  // Increment usage
  async incrementUsage(organizationId: string, type: 'documents' | 'queries' | 'storage', amount: number): Promise<void>
  
  // Get current usage
  async getCurrentUsage(organizationId: string): Promise<UsageRecord>
}

export const subscriptionService = new SubscriptionService()
```

Implement tất cả methods với proper error handling.
```

---

## DAY 8: CHECKOUT FLOW IMPLEMENTATION

### PROMPT 8.1 - Tạo Pricing Page

```
Tạo trang Pricing tại `src/app/pricing/page.tsx`:

Yêu cầu:
1. Hiển thị 4 tiers với features comparison
2. Toggle Monthly/Yearly billing (show savings)
3. CTA buttons:
   - Free: "Get Started" → signup
   - Paid tiers: "Subscribe" → checkout
4. Current plan indicator (nếu đã login)
5. FAQ section
6. Enterprise contact section

Design:
- Responsive grid layout
- Highlight recommended plan (Pro)
- Feature checkmarks
- Price với strikethrough cho yearly savings

Components cần tạo:
- `src/components/pricing/PricingCard.tsx`
- `src/components/pricing/PricingTable.tsx`
- `src/components/pricing/PricingToggle.tsx`
- `src/components/pricing/PricingFAQ.tsx`
```

### PROMPT 8.2 - Tạo Checkout API Route

```
Tạo API route cho checkout:

File: `src/app/api/stripe/checkout/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/config'
import { createClient } from '@/lib/supabase/server'
import { subscriptionService } from '@/services/subscriptionService'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { priceId, billingCycle } = await request.json()
    
    // Get or create Stripe customer
    const customerId = await subscriptionService.getOrCreateCustomer(
      user.id,
      user.email!
    )
    
    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      metadata: {
        userId: user.id,
        billingCycle,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
        },
      },
    })
    
    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
```
```

### PROMPT 8.3 - Tạo Checkout Success/Cancel Pages

```
Tạo pages cho checkout flow:

File: `src/app/checkout/success/page.tsx`
- Verify session với Stripe
- Show success message
- Redirect to dashboard sau 3 giây
- Display subscription details

File: `src/app/checkout/cancel/page.tsx`
- Show cancellation message
- Link back to pricing
- Optional: Show discount/retry offer

Components:
- Loading state while verifying
- Success animation
- Subscription summary card
```

### PROMPT 8.4 - Integrate Checkout vào Pricing

```
Update Pricing page để handle checkout:

1. Add checkout button handler:
```typescript
const handleCheckout = async (priceId: string) => {
  if (!user) {
    // Redirect to login with return URL
    router.push(`/login?redirect=/pricing&plan=${planName}`)
    return
  }
  
  setLoading(true)
  try {
    const response = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId, billingCycle }),
    })
    
    const { url } = await response.json()
    window.location.href = url
  } catch (error) {
    toast.error('Failed to start checkout')
  } finally {
    setLoading(false)
  }
}
```

2. Show current plan for logged-in users
3. Disable checkout button for current plan
4. Handle upgrade/downgrade flows
```

---

## DAY 9: SUBSCRIPTION MANAGEMENT

### PROMPT 9.1 - Customer Portal Integration

```
Tạo API route cho Customer Portal:

File: `src/app/api/stripe/portal/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/config'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get Stripe customer ID from database
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()
    
    if (!subscription?.stripe_customer_id) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 })
    }
    
    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing`,
    })
    
    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Portal error:', error)
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    )
  }
}
```
```

### PROMPT 9.2 - Billing Settings Page

```
Tạo trang Billing trong Settings:

File: `src/app/(protected)/settings/billing/page.tsx`

Sections:
1. Current Plan
   - Plan name & price
   - Billing cycle
   - Next billing date
   - Status indicator

2. Usage Overview
   - Documents: X / Y used
   - Queries: X / Y used
   - Storage: X / Y used
   - Progress bars
   - "Upgrade" button if near limits

3. Payment Method
   - Current card (last 4 digits)
   - "Update" button → Customer Portal

4. Billing History
   - List of invoices
   - Download PDF links

5. Actions
   - "Manage Subscription" → Customer Portal
   - "Cancel Subscription" → Confirmation modal

Components:
- `src/components/billing/CurrentPlan.tsx`
- `src/components/billing/UsageOverview.tsx`
- `src/components/billing/BillingHistory.tsx`
- `src/components/billing/CancelSubscriptionModal.tsx`
```

### PROMPT 9.3 - Usage Tracking Integration

```
Integrate usage tracking vào existing features:

1. Track document uploads:
File: `src/app/api/documents/upload/route.ts`
```typescript
// Before processing upload
const usageCheck = await subscriptionService.checkUsageLimits(
  organizationId,
  'document'
)

if (!usageCheck.allowed) {
  return NextResponse.json({
    error: 'Document limit reached',
    current: usageCheck.current,
    limit: usageCheck.limit,
    upgradeUrl: '/pricing'
  }, { status: 403 })
}

// After successful upload
await subscriptionService.incrementUsage(organizationId, 'documents', 1)
await subscriptionService.incrementUsage(organizationId, 'storage', fileSize)
```

2. Track queries:
File: `src/app/api/chat/route.ts` hoặc tương tự
```typescript
// Before processing query
const usageCheck = await subscriptionService.checkUsageLimits(
  organizationId,
  'query'
)

if (!usageCheck.allowed) {
  return NextResponse.json({
    error: 'Query limit reached',
    ...usageCheck,
    upgradeUrl: '/pricing'
  }, { status: 403 })
}

// After successful query
await subscriptionService.incrementUsage(organizationId, 'queries', 1)
```

3. Show upgrade prompts in UI when limits approached
```

---

## DAY 10: WEBHOOK HANDLERS

### PROMPT 10.1 - Stripe Webhook Handler

```
Tạo webhook handler:

File: `src/app/api/webhooks/stripe/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/config'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { subscriptionService } from '@/services/subscriptionService'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')!
  
  let event: Stripe.Event
  
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }
  
  const supabase = createServiceClient()
  
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object, supabase)
        break
        
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object, supabase)
        break
        
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object, supabase)
        break
        
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object, supabase)
        break
        
      case 'invoice.paid':
        await handleInvoicePaid(event.data.object, supabase)
        break
        
      case 'invoice.payment_failed':
        await handleInvoiceFailed(event.data.object, supabase)
        break
        
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }
    
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

// Implement each handler function...
```

Implement handlers cho mỗi event type với proper error handling và logging.
```

### PROMPT 10.2 - Implement Webhook Handlers

```
Implement các handler functions:

1. handleCheckoutCompleted:
   - Get userId từ metadata
   - Update subscription status to 'active'
   - Send welcome email (optional)

2. handleSubscriptionCreated:
   - Create subscription record trong database
   - Set plan limits
   - Initialize usage tracking

3. handleSubscriptionUpdated:
   - Update plan/status trong database
   - Handle upgrade/downgrade
   - Adjust limits accordingly

4. handleSubscriptionDeleted:
   - Set subscription status to 'canceled'
   - Downgrade to FREE plan
   - Send cancellation email (optional)

5. handleInvoicePaid:
   - Create invoice record
   - Reset usage counters for new period
   - Update current_period_start/end

6. handleInvoiceFailed:
   - Update subscription status to 'past_due'
   - Send payment failed notification
   - Schedule retry reminder

Mỗi handler cần:
- Proper error handling
- Logging for debugging
- Idempotency (safe to retry)
```

### PROMPT 10.3 - Testing Webhooks

```
Setup webhook testing:

1. Install Stripe CLI:
```bash
# macOS
brew install stripe/stripe-cli/stripe

# Windows
scoop install stripe

# Login
stripe login
```

2. Forward webhooks to localhost:
```bash
stripe listen --forward-to localhost:3001/api/webhooks/stripe
```

3. Trigger test events:
```bash
# Checkout completed
stripe trigger checkout.session.completed

# Subscription created
stripe trigger customer.subscription.created

# Invoice paid
stripe trigger invoice.paid

# Payment failed
stripe trigger invoice.payment_failed
```

4. Test full flow:
- Create test checkout
- Verify webhook received
- Check database updated
- Verify usage limits applied

5. Test edge cases:
- Webhook retry
- Invalid signature
- Database error during webhook
```

---

## FILES CẦN TẠO/UPDATE TRONG PHASE A2

```
src/
├── app/
│   ├── api/
│   │   ├── stripe/
│   │   │   ├── checkout/
│   │   │   │   └── route.ts
│   │   │   └── portal/
│   │   │       └── route.ts
│   │   └── webhooks/
│   │       └── stripe/
│   │           └── route.ts
│   ├── pricing/
│   │   └── page.tsx
│   ├── checkout/
│   │   ├── success/
│   │   │   └── page.tsx
│   │   └── cancel/
│   │       └── page.tsx
│   └── (protected)/
│       └── settings/
│           └── billing/
│               └── page.tsx
├── components/
│   ├── pricing/
│   │   ├── PricingCard.tsx
│   │   ├── PricingTable.tsx
│   │   ├── PricingToggle.tsx
│   │   └── PricingFAQ.tsx
│   └── billing/
│       ├── CurrentPlan.tsx
│       ├── UsageOverview.tsx
│       ├── BillingHistory.tsx
│       └── CancelSubscriptionModal.tsx
├── lib/
│   └── stripe/
│       ├── config.ts
│       └── client.ts
└── services/
    └── subscriptionService.ts

supabase/
└── migrations/
    └── 002_subscriptions.sql

docs/
├── STRIPE_SETUP.md
└── PHASE_A2_COMPLETE.md
```

---

## TESTING CHECKLIST PHASE A2

```
### Stripe Setup
- [ ] Products created in Stripe Dashboard
- [ ] Price IDs configured in env
- [ ] Webhook endpoint configured
- [ ] Customer Portal enabled

### Checkout Flow
- [ ] Pricing page displays correctly
- [ ] Monthly/Yearly toggle works
- [ ] Checkout redirects to Stripe
- [ ] Success page shows after payment
- [ ] Subscription created in database

### Subscription Management
- [ ] Current plan displayed in settings
- [ ] Usage tracking accurate
- [ ] Customer Portal accessible
- [ ] Plan change works

### Webhooks
- [ ] checkout.session.completed handled
- [ ] subscription.created handled
- [ ] subscription.updated handled
- [ ] subscription.deleted handled
- [ ] invoice.paid handled
- [ ] invoice.payment_failed handled

### Usage Limits
- [ ] Document upload checks limits
- [ ] Query checks limits
- [ ] Upgrade prompt shown when near limit
- [ ] Blocked when limit exceeded
```

---

## TIẾP THEO

Sau khi hoàn thành Phase A2:
→ **Phase A3: Usage Limits & Gating**
