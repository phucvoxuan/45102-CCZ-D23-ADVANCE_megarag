# MegaRAG Pre-Launch Checklist

## Pre-Launch Tasks

### 1. Environment Configuration

- [ ] **Production Environment Variables**
  - [ ] `NEXT_PUBLIC_SUPABASE_URL` - Production Supabase URL
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Production anon key
  - [ ] `SUPABASE_SERVICE_ROLE_KEY` - Production service role key
  - [ ] `GOOGLE_AI_API_KEY` - Gemini API key (with billing enabled)
  - [ ] `ENCRYPTION_KEY` - Generate new: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
  - [ ] `NEXT_PUBLIC_APP_URL` - Production domain (e.g., https://aidorag.com)

- [ ] **Payment Configuration (Payhip)**
  - [ ] `NEXT_PUBLIC_PAYHIP_ENABLED=true`
  - [ ] `NEXT_PUBLIC_STRIPE_ENABLED=false`
  - [ ] `PAYHIP_API_KEY` - From Payhip Dashboard > Settings > API
  - [ ] All `PAYHIP_*_URL` variables set for each plan
  - [ ] `PAYHIP_WEBHOOK_SECRET` - Configure webhook in Payhip

### 2. Payhip Setup

- [ ] **Create Membership Products**
  - [ ] STARTER Monthly ($29/month)
  - [ ] STARTER Yearly ($290/year)
  - [ ] PRO Monthly ($99/month)
  - [ ] PRO Yearly ($990/year)
  - [ ] BUSINESS Monthly ($299/month)
  - [ ] BUSINESS Yearly ($2990/year)

- [ ] **Configure Webhooks**
  - [ ] Add webhook URL: `https://your-domain.com/api/webhooks/payhip`
  - [ ] Enable events: subscription.created, subscription.updated, subscription.cancelled, payment.completed

- [ ] **VND Pricing (Optional)**
  - [ ] Create VND-priced products for Vietnamese customers
  - [ ] Update PAYHIP URLs for VND variants

### 3. Database Setup

- [ ] **Run Migrations**
  ```bash
  supabase db push
  ```
  - [ ] Verify all tables created
  - [ ] Verify RLS policies active

- [ ] **Create System Admin**
  ```sql
  INSERT INTO system_admins (user_id, role, permissions)
  SELECT id, 'super_admin', '{"all": true}'
  FROM auth.users WHERE email = 'admin@yourdomain.com';
  ```

- [ ] **Initialize Required Data**
  - [ ] Verify default organization created on first user signup
  - [ ] Test FREE plan limits

### 4. Vercel Deployment

- [ ] **Connect Repository**
  - [ ] Link GitHub repo to Vercel
  - [ ] Set production branch (main)

- [ ] **Configure Build Settings**
  - [ ] Framework: Next.js
  - [ ] Build Command: `npm run build`
  - [ ] Output Directory: `.next`

- [ ] **Environment Variables**
  - [ ] Add all production env vars
  - [ ] Mark sensitive vars as encrypted

- [ ] **Domain Setup**
  - [ ] Add custom domain
  - [ ] Configure DNS records
  - [ ] Enable HTTPS (automatic)

### 5. Security Checklist

- [ ] **Authentication**
  - [ ] Supabase Auth configured with production URL
  - [ ] Email templates customized
  - [ ] Rate limiting enabled

- [ ] **API Security**
  - [ ] API routes require authentication
  - [ ] Rate limiting on query endpoints
  - [ ] CORS configured correctly

- [ ] **Data Protection**
  - [ ] RLS policies active on all tables
  - [ ] Service role key only used server-side
  - [ ] No secrets exposed in client code

### 6. Monitoring & Analytics

- [ ] **Error Tracking (Optional)**
  - [ ] Sentry or similar configured
  - [ ] Source maps uploaded

- [ ] **Analytics (Optional)**
  - [ ] Vercel Analytics enabled
  - [ ] Google Analytics / Plausible set up

- [ ] **Uptime Monitoring**
  - [ ] /api/health endpoint working
  - [ ] External monitor configured (e.g., UptimeRobot)

### 7. Content & SEO

- [ ] **Meta Tags**
  - [ ] Title and description set
  - [ ] Open Graph images
  - [ ] Twitter cards

- [ ] **Legal Pages**
  - [ ] Privacy Policy
  - [ ] Terms of Service
  - [ ] Cookie Policy (if needed)

- [ ] **Marketing Content**
  - [ ] Homepage content finalized
  - [ ] Pricing page accurate
  - [ ] All images optimized

### 8. Final Testing

- [ ] **Complete Testing Checklist**
  - [ ] Run through [TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md)
  - [ ] Test on production environment

- [ ] **Mobile Testing**
  - [ ] iOS Safari
  - [ ] Android Chrome
  - [ ] Responsive layouts

- [ ] **Cross-Browser**
  - [ ] Chrome
  - [ ] Firefox
  - [ ] Safari
  - [ ] Edge

---

## Launch Day Procedure

### Pre-Launch (1 hour before)
1. [ ] Final production build deployed
2. [ ] All team members notified
3. [ ] Support channels ready

### Launch
1. [ ] Switch DNS to production
2. [ ] Verify site accessible
3. [ ] Test payment flow
4. [ ] Post announcement

### Post-Launch (First 24 hours)
1. [ ] Monitor error logs
2. [ ] Check feedback submissions
3. [ ] Respond to user issues
4. [ ] Track signup metrics

---

## Emergency Rollback

If critical issues occur:

1. **Revert Deployment**
   ```bash
   vercel rollback
   ```

2. **Notify Users**
   - Update status page
   - Send email if needed

3. **Fix & Redeploy**
   - Identify root cause
   - Test fix locally
   - Deploy with `vercel --prod`

---

## Contact Information

- **Technical Lead**: [name@email.com]
- **Supabase Support**: https://supabase.com/dashboard/support
- **Vercel Support**: https://vercel.com/help
- **Payhip Support**: https://payhip.com/support

---

**Last Updated:** 2026-01-19
