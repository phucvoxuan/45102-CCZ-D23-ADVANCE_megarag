# MegaRAG Testing Checklist

## Pre-Launch End-to-End Testing Guide

### 1. Authentication Flow

- [ ] **Sign Up**
  - [ ] Register new account with email
  - [ ] Verify email confirmation sent
  - [ ] Complete onboarding flow

- [ ] **Sign In**
  - [ ] Login with email/password
  - [ ] Test "Forgot Password" flow
  - [ ] Verify redirect after login

- [ ] **Session Management**
  - [ ] Session persists on refresh
  - [ ] Logout clears session
  - [ ] Protected routes redirect when logged out

### 2. Document Processing

- [ ] **Text Files**
  - [ ] Upload .txt file (< 5MB)
  - [ ] Verify chunking works correctly
  - [ ] Check embeddings generated

- [ ] **PDF Files**
  - [ ] Upload single-page PDF
  - [ ] Upload multi-page PDF (10+ pages)
  - [ ] Verify text extraction

- [ ] **Office Documents**
  - [ ] Upload .docx file
  - [ ] Upload .xlsx file
  - [ ] Upload .pptx file

- [ ] **Media Files**
  - [ ] Upload audio file (.mp3)
  - [ ] Upload video file (.mp4)
  - [ ] Verify transcription works

- [ ] **Error Handling**
  - [ ] Test file size limits (per plan)
  - [ ] Test unsupported file types
  - [ ] Verify error messages display

### 3. RAG Query System

- [ ] **Basic Search**
  - [ ] Query returns relevant results
  - [ ] Sources displayed correctly
  - [ ] Response time < 5 seconds

- [ ] **Query Modes**
  - [ ] Test "Default" mode
  - [ ] Test "Detailed" mode
  - [ ] Test "Summary" mode
  - [ ] Test "Graph" mode (if enabled)
  - [ ] Test "Hybrid" mode

- [ ] **Knowledge Graph**
  - [ ] Entities extracted correctly
  - [ ] Relations displayed
  - [ ] Graph visualization works

### 4. Payment System (Payhip)

- [ ] **Pricing Page**
  - [ ] All plans display correctly
  - [ ] Prices match plans.ts
  - [ ] Comparison table accurate

- [ ] **Checkout Flow**
  - [ ] "Get Started" redirects to Payhip
  - [ ] Cancel URL works
  - [ ] Success URL works

- [ ] **Webhook Processing**
  - [ ] Test webhook with Payhip sandbox
  - [ ] Subscription created in database
  - [ ] User plan updated correctly

- [ ] **Plan Limits**
  - [ ] FREE: 5 docs, 100 queries, 50MB
  - [ ] STARTER: 50 docs, 1000 queries, 1GB
  - [ ] PRO: 200 docs, 5000 queries, 5GB
  - [ ] BUSINESS: 1000 docs, 20000 queries, 20GB

### 5. Widget System

- [ ] **Widget Creation**
  - [ ] Create new widget
  - [ ] Configure appearance
  - [ ] Set greeting message

- [ ] **Widget Embedding**
  - [ ] Copy embed code
  - [ ] Test on external page
  - [ ] Widget loads correctly

- [ ] **Widget Chat**
  - [ ] Send message
  - [ ] Receive AI response
  - [ ] Sources displayed

- [ ] **Branding**
  - [ ] STARTER: Shows "Powered by AIDORag"
  - [ ] PRO+: Custom branding works

### 6. Admin Dashboard

- [ ] **Overview**
  - [ ] Stats display correctly
  - [ ] Charts render

- [ ] **Documents Tab**
  - [ ] List all documents
  - [ ] Delete document
  - [ ] View document details

- [ ] **Usage Tab**
  - [ ] Current usage shown
  - [ ] Limits displayed
  - [ ] Usage bars accurate

### 7. System Admin Panel

- [ ] **Organizations**
  - [ ] List all organizations
  - [ ] View org details
  - [ ] Edit org settings

- [ ] **Revenue Dashboard**
  - [ ] MRR calculation correct
  - [ ] Subscription counts accurate
  - [ ] Charts render

- [ ] **Promo Codes**
  - [ ] Create new promo code
  - [ ] Test code application
  - [ ] View redemption stats

### 8. API Endpoints (PRO+)

- [ ] **API Key Management**
  - [ ] Generate new API key
  - [ ] Revoke API key
  - [ ] Key works in requests

- [ ] **REST API**
  - [ ] POST /api/v1/documents
  - [ ] GET /api/v1/documents
  - [ ] POST /api/v1/query
  - [ ] Rate limiting works

### 9. i18n / Localization

- [ ] **Language Switching**
  - [ ] English displays correctly
  - [ ] Vietnamese displays correctly
  - [ ] Language persists

- [ ] **Content**
  - [ ] All text translated
  - [ ] No missing keys
  - [ ] Currency formatting correct

### 10. Security Checks

- [ ] **Headers**
  - [ ] X-Content-Type-Options present
  - [ ] X-Frame-Options present (except widgets)
  - [ ] HSTS enabled

- [ ] **Authentication**
  - [ ] API routes protected
  - [ ] CSRF protection
  - [ ] Session security

- [ ] **Data Protection**
  - [ ] User can only see own data
  - [ ] Admin routes protected
  - [ ] Service role key not exposed

### 11. Performance

- [ ] **Load Time**
  - [ ] Homepage < 3s
  - [ ] Dashboard < 2s
  - [ ] Chat response < 5s

- [ ] **Mobile Responsiveness**
  - [ ] Homepage responsive
  - [ ] Dashboard mobile-friendly
  - [ ] Widget mobile-optimized

### 12. Error States

- [ ] **404 Page**
  - [ ] Custom 404 displays
  - [ ] Navigation works

- [ ] **API Errors**
  - [ ] Graceful error handling
  - [ ] User-friendly messages
  - [ ] No stack traces exposed

---

## Testing Notes

**Environment URLs:**
- Development: http://localhost:3000
- Staging: (TBD)
- Production: (TBD)

**Test Accounts:**
- FREE tier: test-free@example.com
- STARTER tier: test-starter@example.com
- PRO tier: test-pro@example.com
- BUSINESS tier: test-business@example.com
- System Admin: (configured in system_admins table)

**Last Updated:** 2026-01-19
