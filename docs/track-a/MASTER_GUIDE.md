# 🚀 MEGARAG TRACK A - MASTER GUIDE

## Hướng Dẫn Sử Dụng Bộ Prompts Này

Bộ tài liệu này gồm 6 files markdown, mỗi file chứa các prompts chi tiết để Claude Code thực hiện từng phase của Track A.

---

## 📁 CẤU TRÚC FILES

```
track_a_prompts/
├── MASTER_GUIDE.md              ← File này (đọc trước)
├── PHASE_0_PROJECT_VERIFICATION.md   ← Day 0: Setup & Verify
├── PHASE_A1_AUTHENTICATION.md        ← Day 1-5: Auth System
├── PHASE_A2_PAYMENT.md               ← Day 6-10: Stripe Payment
├── PHASE_A3_USAGE_LIMITS.md          ← Day 11-13: Usage & Limits
├── PHASE_A4_LANDING_PAGE.md          ← Day 14-17: Landing & Polish
└── PHASE_A5_DEPLOY_LAUNCH.md         ← Day 18-21: Deploy & Launch
```

---

## 🎯 CÁCH SỬ DỤNG

### Bước 1: Copy Files Vào Project

Copy tất cả files vào thư mục `docs/track-a/` trong project MegaRAG:

```bash
# Trong project root
mkdir -p docs/track-a
# Copy tất cả files .md vào đây
```

### Bước 2: Bắt Đầu Với Phase 0

Mở Claude Code trong Cursor và paste prompt sau:

```
Hãy đọc file docs/track-a/PHASE_0_PROJECT_VERIFICATION.md và thực hiện tất cả các bước trong đó để:
1. Phân tích cấu trúc project MegaRAG
2. Cài đặt dependencies
3. Chạy development server trên port khả dụng (tránh 3000, 3100)
4. Báo cáo kết quả

Sau khi hoàn thành, tạo summary về những gì đã làm và những gì cần chuẩn bị cho Phase A1.
```

### Bước 3: Tiến Hành Từng Phase

Sau khi Phase 0 hoàn thành, tiếp tục với mỗi phase:

```
Hãy đọc file docs/track-a/PHASE_A1_AUTHENTICATION.md và thực hiện các prompts theo thứ tự từ Day 1 đến Day 5.

Với mỗi prompt:
1. Đọc và hiểu yêu cầu
2. Implement code
3. Test kết quả
4. Báo cáo progress

Khi hoàn thành một Day, hãy confirm trước khi tiếp tục Day tiếp theo.
```

---

## 📋 TIMELINE TỔNG QUAN

```
┌─────────────────────────────────────────────────────────────────┐
│                    TRACK A TIMELINE (21 DAYS)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  PHASE 0: PROJECT VERIFICATION (Day 0)                          │
│  ├── Analyze project structure                                  │
│  ├── Install dependencies                                       │
│  ├── Run localhost                                              │
│  └── Verify current features                                    │
│                                                                  │
│  PHASE A1: AUTHENTICATION (Day 1-5)                             │
│  ├── Day 1: Supabase Auth Setup                                │
│  ├── Day 2: Login/Signup UI                                    │
│  ├── Day 3: Middleware & Protection                            │
│  ├── Day 4: Profile & Settings                                 │
│  └── Day 5: Testing & Fixes                                    │
│                                                                  │
│  PHASE A2: PAYMENT (Day 6-10)                                   │
│  ├── Day 6: Stripe Setup                                       │
│  ├── Day 7: Database Schema                                    │
│  ├── Day 8: Checkout Flow                                      │
│  ├── Day 9: Subscription Management                            │
│  └── Day 10: Webhooks                                          │
│                                                                  │
│  PHASE A3: USAGE LIMITS (Day 11-13)                             │
│  ├── Day 11: Usage Tracking                                    │
│  ├── Day 12: Limit Enforcement                                 │
│  └── Day 13: Dashboard & Prompts                               │
│                                                                  │
│  PHASE A4: LANDING PAGE (Day 14-17)                             │
│  ├── Day 14: Hero & Features                                   │
│  ├── Day 15: Pricing & CTA                                     │
│  ├── Day 16: UI Polish                                         │
│  └── Day 17: SEO & Analytics                                   │
│                                                                  │
│  PHASE A5: DEPLOY & LAUNCH (Day 18-21)                          │
│  ├── Day 18: Vercel Setup                                      │
│  ├── Day 19: E2E Testing                                       │
│  ├── Day 20: Soft Launch                                       │
│  └── Day 21: Public Launch 🚀                                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 WORKFLOW CHO MỖI PHASE

### Mẫu Prompt Để Bắt Đầu Mỗi Phase

```
# PHASE [X]: [TÊN PHASE]

Hãy đọc file docs/track-a/PHASE_[X]_[NAME].md

## Yêu cầu:
1. Đọc toàn bộ file để hiểu scope
2. Thực hiện từng prompt theo thứ tự
3. Sau mỗi prompt, verify kết quả trước khi tiếp tục
4. Nếu gặp lỗi, fix trước khi tiếp tục
5. Cuối phase, chạy testing checklist

## Output mong đợi:
- Code đã implement
- Files đã tạo/update
- Testing passed
- Summary những gì đã làm
```

### Mẫu Prompt Để Resume Giữa Chừng

```
Tôi đang ở Phase [X], Day [Y], Prompt [Z].

Hãy đọc lại docs/track-a/PHASE_[X]_[NAME].md, tìm đến phần Prompt [Z] và tiếp tục từ đó.

Context:
- Đã hoàn thành: [list]
- Đang làm: [current task]
- Vấn đề gặp phải: [nếu có]
```

---

## ⚡ QUICK START COMMANDS

### Phase 0 - Verify & Run Localhost

```
Đọc docs/track-a/PHASE_0_PROJECT_VERIFICATION.md và thực hiện:

1. Liệt kê cấu trúc project
2. Kiểm tra package.json
3. Cài đặt dependencies: npm install
4. Tạo .env.local từ .env.example
5. Chạy dev server trên port 3001: PORT=3001 npm run dev

Báo cáo kết quả và URL để test.
```

### Phase A1 - Authentication

```
Đọc docs/track-a/PHASE_A1_AUTHENTICATION.md và bắt đầu Day 1:

1. Kiểm tra Supabase Auth đã setup chưa
2. Tạo/update Supabase client files
3. Cài đặt @supabase/ssr nếu chưa có

Báo cáo những gì đã có và những gì cần thêm.
```

### Phase A2 - Payment

```
Đọc docs/track-a/PHASE_A2_PAYMENT.md và bắt đầu Day 6:

1. Tạo file docs/STRIPE_SETUP.md với hướng dẫn
2. Cài đặt stripe và @stripe/stripe-js
3. Tạo src/lib/stripe/config.ts với PLANS config

Verify setup trước khi tiếp tục.
```

### Phase A3 - Usage Limits

```
Đọc docs/track-a/PHASE_A3_USAGE_LIMITS.md và bắt đầu Day 11:

1. Tạo/update UsageService
2. Tạo database migration cho usage functions
3. Test usage tracking

Báo cáo implementation.
```

### Phase A4 - Landing Page

```
Đọc docs/track-a/PHASE_A4_LANDING_PAGE.md và bắt đầu Day 14:

1. Phân tích design system hiện tại
2. Tạo structure cho marketing pages
3. Implement Hero section

Show preview và báo cáo.
```

### Phase A5 - Deploy

```
Đọc docs/track-a/PHASE_A5_DEPLOY_LAUNCH.md và bắt đầu Day 18:

1. Verify build: npm run build
2. Check tất cả env vars
3. Tạo docs/VERCEL_DEPLOYMENT.md

Confirm ready for deployment.
```

---

## 📊 TRACKING PROGRESS

Sử dụng checklist này để track progress:

```markdown
# Track A Progress

## Phase 0: Project Verification
- [ ] Project structure analyzed
- [ ] Dependencies installed
- [ ] Localhost running
- [ ] Current features verified

## Phase A1: Authentication (Day 1-5)
- [ ] Day 1: Supabase Auth setup
- [ ] Day 2: Login/Signup pages
- [ ] Day 3: Middleware & protection
- [ ] Day 4: Profile & settings
- [ ] Day 5: Testing complete

## Phase A2: Payment (Day 6-10)
- [ ] Day 6: Stripe configuration
- [ ] Day 7: Database schema
- [ ] Day 8: Checkout flow
- [ ] Day 9: Subscription management
- [ ] Day 10: Webhooks working

## Phase A3: Usage Limits (Day 11-13)
- [ ] Day 11: Usage tracking
- [ ] Day 12: Limit enforcement
- [ ] Day 13: Dashboard & prompts

## Phase A4: Landing Page (Day 14-17)
- [ ] Day 14: Hero & features
- [ ] Day 15: Pricing & CTA
- [ ] Day 16: UI polish
- [ ] Day 17: SEO & analytics

## Phase A5: Deploy & Launch (Day 18-21)
- [ ] Day 18: Vercel setup
- [ ] Day 19: E2E testing
- [ ] Day 20: Soft launch
- [ ] Day 21: Public launch 🚀

## Final Checklist
- [ ] All features working
- [ ] Payments processing
- [ ] No critical bugs
- [ ] Live on production URL
```

---

## 🛠️ TROUBLESHOOTING

### Common Issues

**1. Build Errors**
```
Nếu npm run build fails:
1. Đọc error message
2. Fix TypeScript errors trước
3. Fix ESLint warnings
4. Re-run build
```

**2. Environment Variables**
```
Nếu app không chạy vì missing env vars:
1. Check .env.example cho list đầy đủ
2. Copy to .env.local
3. Fill in actual values
4. Restart dev server
```

**3. Database Issues**
```
Nếu Supabase queries fail:
1. Check connection string
2. Verify tables exist
3. Check RLS policies
4. Run migrations nếu cần
```

**4. Stripe Webhooks**
```
Nếu webhooks không nhận được:
1. Check webhook URL đúng
2. Verify webhook secret
3. Check Stripe dashboard logs
4. Test với Stripe CLI locally
```

---

## 📞 GETTING HELP

Nếu stuck ở bất kỳ phase nào:

1. **Check Logs**: Đọc error messages carefully
2. **Search Docs**: Supabase, Stripe, Next.js docs
3. **Ask Claude**: Describe error + context
4. **Take Break**: Sometimes fresh eyes help

### Prompt Để Ask For Help

```
Tôi đang ở Phase [X], implementing [feature].

Error gặp phải:
[paste error message]

Code đang có:
[paste relevant code]

Đã thử:
[list what you tried]

Hãy giúp tôi debug và fix issue này.
```

---

## 🎉 SUCCESS CRITERIA

Track A được coi là COMPLETE khi:

✅ **Authentication Working**
- Users can signup/login
- Sessions persist
- Protected routes work

✅ **Payments Working**
- Stripe checkout works
- Subscriptions created
- Webhooks processing

✅ **Usage Limits Working**
- Tracking accurate
- Limits enforced
- Upgrade prompts shown

✅ **Landing Page Live**
- Professional design
- All sections present
- Mobile responsive

✅ **Deployed & Accessible**
- Live on custom domain
- HTTPS working
- No critical bugs

✅ **First Revenue**
- At least 1 paying customer
- Payment processed successfully

---

## 🚀 LET'S BUILD!

Bắt đầu với Phase 0:

```
Hãy đọc file docs/track-a/PHASE_0_PROJECT_VERIFICATION.md và thực hiện tất cả các bước để verify project và chạy localhost.
```

Good luck! 🍀
