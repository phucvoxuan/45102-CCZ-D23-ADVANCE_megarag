# Supabase Setup Guide

This guide will help you set up Supabase (Database + Authentication) for MegaRAG.

---

## Part 1: Authentication Setup

### 1.1 Enable Email Provider

1. Go to **Authentication** > **Providers**
2. Find **Email** provider (usually enabled by default)
3. Configure:
   - **Enable Email provider**: ON
   - **Confirm email**:
     - OFF for development (easier testing)
     - ON for production
   - **Secure email change**: ON
   - **Double confirm changes**: ON (recommended)

### 1.2 Enable Google OAuth (Optional)

1. Go to **Authentication** > **Providers** > **Google**
2. Toggle to Enable
3. Get Google OAuth credentials:

**Getting Google OAuth Credentials:**
1. Visit [Google Cloud Console](https://console.cloud.google.com)
2. Create or select a project
3. Go to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. Application type: **Web application**
6. Authorized redirect URIs:
   ```
   https://your-project.supabase.co/auth/v1/callback
   ```
7. Copy **Client ID** and **Client Secret**
8. Paste into Supabase Dashboard

### 1.3 Configure URL Settings

1. Go to **Authentication** > **URL Configuration**
2. Configure:
   - **Site URL**: `http://localhost:3000` (development) or your production URL
   - **Redirect URLs**: Add allowed redirect URLs
     ```
     http://localhost:3000/**
     https://your-production-domain.com/**
     ```

### 1.4 Customize Email Templates (Optional)

1. Go to **Authentication** > **Email Templates**
2. Customize templates:

**Confirm signup:**
```html
<h2>Confirm your signup</h2>
<p>Welcome to MegaRAG! Click the button below to confirm your email:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm Email</a></p>
```

**Reset password:**
```html
<h2>Reset Password</h2>
<p>Click the button below to reset your password:</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
```

### 1.5 Profiles Table for User Data

Run this SQL in Supabase SQL Editor to create user profiles:

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

-- Policy: Users can view own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can update own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Trigger: Auto-create profile on signup
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

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### 1.6 Test Auth Setup

After setup, test by visiting:
```
http://localhost:3000/api/auth/test
```

Expected response:
```json
{
  "success": true,
  "data": {
    "supabaseConnected": true,
    "user": null,
    "profilesTableExists": true
  }
}
```

---

## Part 2: Database Setup

This section covers the database setup for MegaRAG.

## Prerequisites

1. A Supabase account (https://supabase.com)
2. A Supabase project created
3. Your environment variables configured in `.env.local`

## Environment Variables

Make sure your `.env.local` contains:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

You can find these values in your Supabase project dashboard under **Settings > API**.

## Database Setup

### Step 1: Open SQL Editor

1. Go to your Supabase project dashboard
2. Click on **SQL Editor** in the left sidebar

### Step 2: Run Migration Files

Run the following SQL files **in order**:

#### 1. Core Schema (Required)

Copy and paste the contents of `supabase/core_schema.sql` into the SQL Editor and click **Run**.

This creates:
- `documents` - Stores uploaded file metadata
- `chunks` - Stores text chunks with vector embeddings
- `entities` - Stores extracted entities
- `relations` - Stores relationships between entities
- `chat_sessions` - Stores conversation sessions
- `chat_messages` - Stores chat messages
- `llm_cache` - Caches AI responses
- Vector search functions (`search_chunks`, `search_entities`, `search_relations`)

#### 2. White Label Schema (Optional - for multi-tenant)

If you need multi-tenant support with organizations:

```sql
-- Run supabase/white_label_schema.sql
```

This creates:
- `organizations` - Tenant/organization data
- `api_keys` - API keys per organization
- `usage_logs` - Usage tracking

#### 3. Chat Tables (If not in core_schema)

```sql
-- Run supabase/chat_tables.sql
```

#### 4. Additional Chat Settings

```sql
-- Run supabase/add_chat_settings.sql
```

## Verify Setup

### Option 1: Use Test Script

```bash
# Install dotenv if not already
npm install dotenv

# Run test script
node scripts/test-supabase.js
```

Expected output:
```
========================================
  MegaRAG - Supabase Connection Test
========================================

Supabase URL: https://xxx.supabase.co
Connection: OK

Checking required tables:
----------------------------------------
  [x] documents - OK
  [x] chunks - OK
  [x] entities - OK
  [x] relations - OK
  [x] chat_sessions - OK
  [x] chat_messages - OK
  [x] llm_cache - OK

All required tables exist!
```

### Option 2: Check in Supabase Dashboard

1. Go to **Table Editor** in Supabase
2. You should see all the tables listed

## Troubleshooting

### Error: "Could not find the table in the schema cache" (PGRST205)

After creating tables, Supabase's PostgREST needs to refresh its schema cache. To fix:

**Option 1: Reload Schema (Recommended)**
1. Go to your Supabase Dashboard
2. Navigate to **Database > Database Management**
3. Click **Reload Schema** button

**Option 2: Wait for Auto-Refresh**
The schema cache automatically refreshes every few minutes. Wait 2-5 minutes and try again.

**Option 3: Restart PostgREST**
Go to **Settings > API** and toggle the API to restart PostgREST.

### Error: "relation does not exist"

This means the tables haven't been created. Run the SQL migrations above.

### Error: "permission denied"

Make sure you're using the **Service Role Key** (not the anon key) for server-side operations.

### Error: "could not find extension vector"

The `pgvector` extension needs to be enabled. Run:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### Connection Timeout

1. Check your Supabase URL is correct
2. Check your network/firewall settings
3. Verify the project is not paused (free tier projects pause after inactivity)

## Storage Setup

MegaRAG uses Supabase Storage for file uploads. Create a bucket:

1. Go to **Storage** in Supabase dashboard
2. Click **New Bucket**
3. Name it `documents`
4. Set to **Public** or configure RLS policies as needed

## Row Level Security (RLS)

By default, RLS is disabled for simplicity. For production, you should:

1. Enable RLS on each table
2. Create appropriate policies based on your auth requirements

Example for documents table:
```sql
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users
CREATE POLICY "Allow all for authenticated" ON documents
  FOR ALL USING (true);
```

## Next Steps

After database setup:

1. Restart your development server: `PORT=3001 npm run dev`
2. Visit http://localhost:3001/admin to verify the dashboard loads
3. Try uploading a document to test the full pipeline
