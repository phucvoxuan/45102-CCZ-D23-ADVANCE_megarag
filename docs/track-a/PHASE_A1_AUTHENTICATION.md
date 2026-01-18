# PHASE A1: AUTHENTICATION SYSTEM

## Thời gian: Day 1-5
## Mục tiêu: Implement user authentication với Supabase Auth

---

## TỔNG QUAN PHASE A1

```
Day 1: Setup Supabase Auth configuration
Day 2: Implement Auth UI (Login, Signup pages)
Day 3: Auth Middleware & Route Protection
Day 4: User Profile & Settings
Day 5: Testing & Bug Fixes
```

---

## DAY 1: SUPABASE AUTH SETUP

### PROMPT 1.1 - Kiểm tra Supabase Auth hiện tại

```
Hãy kiểm tra project MegaRAG xem đã có setup Supabase Auth chưa:

1. Tìm và đọc các file liên quan đến Supabase:
   - src/lib/supabase.ts hoặc tương tự
   - Các file trong thư mục src/lib/ hoặc src/utils/
   - File .env.example để xem các biến Supabase

2. Kiểm tra xem có các components auth đã có chưa:
   - Login page
   - Signup page
   - Auth context/provider

3. Báo cáo:
   - Supabase client đã được setup chưa?
   - Auth đã implement hay chưa?
   - Cần thêm gì để hoàn thiện?
```

### PROMPT 1.2 - Setup Supabase Auth Client

```
Dựa trên kết quả kiểm tra, hãy setup/update Supabase Auth client:

1. Nếu chưa có, tạo file `src/lib/supabase/client.ts`:

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

2. Tạo file `src/lib/supabase/server.ts` cho Server Components:

```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component - ignore
          }
        },
      },
    }
  )
}
```

3. Cài đặt dependencies cần thiết:
```bash
npm install @supabase/ssr @supabase/supabase-js
```

4. Verify setup bằng cách tạo một test API route
```

### PROMPT 1.3 - Setup Supabase Auth trong Dashboard

```
Tạo file hướng dẫn `docs/SUPABASE_SETUP.md` với nội dung:

# Supabase Auth Setup Guide

## Bước 1: Tạo Supabase Project (nếu chưa có)
1. Truy cập https://supabase.com
2. Tạo new project
3. Lưu lại Project URL và Anon Key

## Bước 2: Enable Email Provider
1. Vào Authentication > Providers
2. Enable Email provider
3. Cấu hình:
   - Confirm email: ON (production) / OFF (development)
   - Secure email change: ON

## Bước 3: Enable Google OAuth (Optional)
1. Vào Authentication > Providers > Google
2. Enable Google
3. Thêm Client ID và Client Secret từ Google Cloud Console
4. Cấu hình Authorized redirect URIs

## Bước 4: Cấu hình Email Templates
1. Vào Authentication > Email Templates
2. Customize:
   - Confirm signup
   - Reset password
   - Magic link

## Bước 5: Update .env.local
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Hãy tạo file này và verify các file Supabase đã setup đúng chưa.
```

---

## DAY 2: AUTH UI IMPLEMENTATION

### PROMPT 2.1 - Tạo Login Page

```
Tạo trang Login cho MegaRAG tại `src/app/(auth)/login/page.tsx`:

Yêu cầu:
1. Design phù hợp với UI hiện tại của MegaRAG (kiểm tra globals.css, tailwind.config)
2. Bao gồm:
   - Email input
   - Password input
   - "Remember me" checkbox
   - "Forgot password" link
   - Submit button với loading state
   - "Don't have account? Sign up" link
   - Google OAuth button (optional)
3. Form validation với error messages
4. Redirect sau khi login thành công
5. Handle các error cases từ Supabase

Sử dụng:
- React Hook Form hoặc native form handling
- Supabase Auth client đã setup
- Toast notifications cho success/error

Lưu ý:
- Kiểm tra xem project đã có UI components (shadcn/ui, etc.) chưa để reuse
- Responsive design
- Accessible (labels, aria attributes)
```

### PROMPT 2.2 - Tạo Signup Page

```
Tạo trang Signup tại `src/app/(auth)/signup/page.tsx`:

Yêu cầu:
1. Bao gồm:
   - Full name input
   - Email input
   - Password input
   - Confirm password input
   - Terms & Conditions checkbox
   - Submit button với loading state
   - "Already have account? Login" link
   - Google OAuth button (optional)
2. Password validation:
   - Minimum 8 characters
   - At least 1 uppercase
   - At least 1 number
   - Show password strength indicator
3. Email confirmation flow
4. Error handling

Sau khi signup thành công:
- Show message "Check your email to confirm"
- Hoặc redirect nếu email confirmation tắt
```

### PROMPT 2.3 - Tạo Forgot Password Page

```
Tạo trang Forgot Password tại `src/app/(auth)/forgot-password/page.tsx`:

Yêu cầu:
1. Email input để nhận reset link
2. Success message sau khi gửi
3. Link quay lại Login

Tạo thêm trang Reset Password tại `src/app/(auth)/reset-password/page.tsx`:
1. Trang này được access từ email reset link
2. New password input
3. Confirm new password input
4. Success message và redirect về Login
```

### PROMPT 2.4 - Tạo Auth Layout

```
Tạo layout cho auth pages tại `src/app/(auth)/layout.tsx`:

Yêu cầu:
1. Centered card layout
2. MegaRAG logo/branding ở trên
3. Clean, minimal design
4. Background gradient hoặc pattern
5. Responsive
6. Redirect nếu user đã login

Structure:
```
(auth)/
├── layout.tsx      # Auth layout
├── login/
│   └── page.tsx
├── signup/
│   └── page.tsx
├── forgot-password/
│   └── page.tsx
└── reset-password/
    └── page.tsx
```
```

---

## DAY 3: AUTH MIDDLEWARE & ROUTE PROTECTION

### PROMPT 3.1 - Tạo Auth Middleware

```
Tạo middleware để protect routes tại `src/middleware.ts`:

Yêu cầu:
1. Check authentication cho protected routes
2. Redirect chưa login → /login
3. Redirect đã login (ở auth pages) → /dashboard hoặc /
4. Preserve intended URL để redirect sau login

Protected routes (cần auth):
- /dashboard/*
- /documents/*
- /chat/*
- /settings/*
- /api/* (trừ public APIs)

Public routes (không cần auth):
- /
- /login
- /signup
- /forgot-password
- /reset-password
- /pricing
- /about

Code structure:
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Implement logic here
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```
```

### PROMPT 3.2 - Tạo Auth Context/Provider

```
Tạo Auth Context để share user state across app:

File: `src/contexts/AuthContext.tsx`

Yêu cầu:
1. AuthProvider wrap toàn bộ app
2. Provide:
   - user: User | null
   - session: Session | null
   - isLoading: boolean
   - signIn(email, password)
   - signUp(email, password, metadata)
   - signOut()
   - signInWithGoogle()
3. Listen to auth state changes
4. Handle refresh token

File: `src/hooks/useAuth.ts`
- Custom hook để access auth context
- Throw error nếu dùng ngoài Provider

Update `src/app/layout.tsx`:
- Wrap app với AuthProvider
```

### PROMPT 3.3 - Tạo Protected Route Component

```
Tạo component để protect individual routes/components:

File: `src/components/auth/ProtectedRoute.tsx`

```typescript
interface ProtectedRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode // Loading component
  redirectTo?: string // Default: /login
}
```

File: `src/components/auth/AuthGuard.tsx`
- Higher-order component version

Ví dụ sử dụng:
```tsx
<ProtectedRoute>
  <DashboardContent />
</ProtectedRoute>
```
```

---

## DAY 4: USER PROFILE & SETTINGS

### PROMPT 4.1 - Database Schema cho User Profile

```
Tạo/update database schema cho user profiles:

File: `supabase/migrations/001_user_profiles.sql`

```sql
-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  organization_id UUID REFERENCES organizations(id),
  role TEXT DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

Kiểm tra xem project đã có schema tương tự chưa và update nếu cần.
```

### PROMPT 4.2 - Tạo Profile Page

```
Tạo trang Profile tại `src/app/(protected)/profile/page.tsx`:

Yêu cầu:
1. Hiển thị thông tin user:
   - Avatar (với upload capability)
   - Full name (editable)
   - Email (read-only)
   - Organization (nếu có)
   - Role
   - Member since
2. Edit mode toggle
3. Save changes với optimistic update
4. Change password section (link hoặc inline)

Components cần tạo:
- `src/components/profile/ProfileCard.tsx`
- `src/components/profile/AvatarUpload.tsx`
- `src/components/profile/ProfileForm.tsx`
```

### PROMPT 4.3 - Tạo Settings Page

```
Tạo trang Settings tại `src/app/(protected)/settings/page.tsx`:

Sections:
1. Account Settings
   - Change email
   - Change password
   - Delete account

2. Notification Settings
   - Email notifications
   - In-app notifications

3. Appearance (optional)
   - Theme (light/dark/system)
   - Language

4. Security
   - Two-factor authentication (future)
   - Active sessions
   - Sign out all devices

Layout:
- Sidebar navigation cho các sections
- Responsive (tabs trên mobile)
```

### PROMPT 4.4 - Organization Setup (nếu chưa có)

```
Kiểm tra và setup Organization management:

Nếu chưa có, tạo:
1. Organizations table (nếu chưa có trong schema)
2. Organization creation flow sau signup
3. Invite members functionality (basic)

File: `src/app/(protected)/organization/page.tsx`
- Hiển thị organization info
- Member list
- Invite new members (future)

Đây là foundation cho multi-tenant architecture.
```

---

## DAY 5: TESTING & BUG FIXES

### PROMPT 5.1 - Testing Checklist

```
Thực hiện testing cho toàn bộ auth flow:

## Manual Testing Checklist

### Signup Flow
- [ ] Signup với email mới → nhận confirmation email
- [ ] Signup với email đã tồn tại → error message
- [ ] Signup với password yếu → validation error
- [ ] Signup với email invalid → validation error
- [ ] Google OAuth signup (nếu có) → success

### Login Flow
- [ ] Login với credentials đúng → redirect to dashboard
- [ ] Login với password sai → error message
- [ ] Login với email không tồn tại → error message
- [ ] "Remember me" functionality
- [ ] Google OAuth login (nếu có) → success

### Password Reset
- [ ] Request reset → nhận email
- [ ] Reset với valid token → success
- [ ] Reset với expired token → error

### Protected Routes
- [ ] Access /dashboard khi chưa login → redirect to /login
- [ ] Access /login khi đã login → redirect to dashboard
- [ ] Session persistence sau refresh
- [ ] Session expired → redirect to login

### Profile & Settings
- [ ] View profile → hiển thị đúng data
- [ ] Update profile → save thành công
- [ ] Change password → success
- [ ] Upload avatar → success

Báo cáo tất cả bugs tìm được và fix.
```

### PROMPT 5.2 - Fix Common Issues

```
Kiểm tra và fix các issues phổ biến:

1. Hydration Errors
   - Đảm bảo server/client components đúng
   - Use 'use client' directive properly

2. Cookie Issues
   - Supabase SSR cookies setup đúng
   - Middleware handles cookies properly

3. Redirect Issues
   - Proper redirect URLs configured in Supabase
   - Handle callback URLs

4. Session Issues
   - Session refresh working
   - Proper error handling for expired sessions

5. UI/UX Issues
   - Loading states
   - Error messages clear
   - Mobile responsive

Sau khi fix, run lại test checklist.
```

### PROMPT 5.3 - Final Verification

```
Verification cuối cùng cho Phase A1:

1. Chạy `npm run build` để check build errors
2. Fix tất cả TypeScript errors
3. Fix tất cả ESLint warnings/errors
4. Test production build: `npm run start`
5. Document any remaining issues

Tạo file `docs/PHASE_A1_COMPLETE.md`:
- Summary of what was implemented
- Known issues (if any)
- Setup instructions for new developers
- Screenshots of auth pages (mô tả)

Output: Xác nhận Phase A1 hoàn thành và ready cho Phase A2.
```

---

## FILES CẦN TẠO/UPDATE TRONG PHASE A1

```
src/
├── app/
│   ├── (auth)/
│   │   ├── layout.tsx
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── signup/
│   │   │   └── page.tsx
│   │   ├── forgot-password/
│   │   │   └── page.tsx
│   │   └── reset-password/
│   │       └── page.tsx
│   └── (protected)/
│       ├── layout.tsx
│       ├── profile/
│       │   └── page.tsx
│       └── settings/
│           └── page.tsx
├── components/
│   └── auth/
│       ├── LoginForm.tsx
│       ├── SignupForm.tsx
│       ├── ForgotPasswordForm.tsx
│       ├── ProtectedRoute.tsx
│       └── AuthGuard.tsx
├── contexts/
│   └── AuthContext.tsx
├── hooks/
│   └── useAuth.ts
├── lib/
│   └── supabase/
│       ├── client.ts
│       └── server.ts
└── middleware.ts

supabase/
└── migrations/
    └── 001_user_profiles.sql

docs/
├── SUPABASE_SETUP.md
└── PHASE_A1_COMPLETE.md
```

---

## TIẾP THEO

Sau khi hoàn thành Phase A1:
→ **Phase A2: Payment Integration với Stripe**
