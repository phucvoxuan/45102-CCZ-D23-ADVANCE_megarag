# BUG ANALYSIS REPORT - MegaRAG Admin Panel

**Report Date:** 2026-01-16
**Tested Account:** test-pro@gmail.com (PRO plan, status: active)
**Environment:** Admin Panel Dashboard

---

## Table of Contents

1. [Bug #1: Billing Page Not Displaying Content](#bug-1-billing-page-not-displaying-content)
2. [Bug #2: Entities and Relations = 0](#bug-2-entities-and-relations--0)
3. [Bug #3: API Requests = 2 Without API Key Creation](#bug-3-api-requests--2-without-api-key-creation)
4. [Summary](#summary)

---

## Bug #1: Billing Page Not Displaying Content

### Symptoms
- Billing page (`/admin/billing`) shows skeleton loading indefinitely
- Page never transitions from loading state to showing actual content

### Files Related

| File | Purpose |
|------|---------|
| `src/app/admin/billing/page.tsx` | Billing page component |
| `src/app/api/usage/route.ts` | Usage API endpoint |
| `src/services/usageService.ts` | Usage data service |
| `src/contexts/AuthContext.tsx` | Authentication context |

### Root Cause Analysis

The billing page code appears correct. The issue is likely in the `usageService.getUsageSummary()` call.

**File:** `src/app/admin/billing/page.tsx` (Lines 51-63)
```typescript
// Fetch data on mount and when user changes
useEffect(() => {
  // Don't fetch if auth is still loading
  if (authLoading) return;

  // If no user, stop loading and return
  if (!user) {
    setLoading(false);
    return;
  }

  // Fetch usage data
  fetchUsage();
}, [user, authLoading]);
```

**Potential Issues:**
1. **API Call Timeout:** `usageService.getUsageSummary()` may be timing out
2. **Missing Subscription Record:** User may not have a subscription record in database
3. **Database Query Error:** Query to subscriptions table may be failing silently

**File:** `src/app/api/usage/route.ts` (Lines 22-23)
```typescript
// Get usage summary
const summary = await usageService.getUsageSummary(user.id);
```

### Proposed Fix

Add error handling and timeout to usage API:

```typescript
// In src/app/admin/billing/page.tsx
const fetchUsage = async () => {
  if (!user) return;

  setLoading(true);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    const response = await fetch('/api/usage', { signal: controller.signal });
    clearTimeout(timeoutId);
    // ... rest of code
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('Usage API timeout');
    }
    // Set default values instead of leaving in loading state
    setUsage(getDefaultUsage());
  } finally {
    setLoading(false);
  }
};
```

### Priority
**MEDIUM** - Page shows loading indefinitely but doesn't crash

---

## Bug #2: Entities and Relations = 0

### Symptoms
- Dashboard shows Entities = 0, Relations = 0
- Document was uploaded successfully (1 document, 9 chunks)
- Database tables `entities` and `relations` are empty for this user

### Files Related

| File | Purpose |
|------|---------|
| `src/lib/processing/entity-extractor.ts` | Entity extraction from text |
| `src/lib/processing/router.ts` | Document processing router |
| `src/app/api/admin/stats/route.ts` | Stats API (counts entities) |
| `supabase/migrations/004_add_user_isolation.sql` | User isolation migration |

### Root Cause Analysis

**IDENTIFIED:** Schema mismatch in entity-extractor.ts was causing silent insert failures.

**File:** `src/lib/processing/entity-extractor.ts` (Lines 252-278)

**Problem:** The code was trying to insert fields that DON'T EXIST in the database schema.

### Schema Comparison

#### Entities Table - Expected vs Code

| Column Name | In Database Schema | Was in Code (WRONG) | Status |
|-------------|-------------------|---------------------|--------|
| `id` | YES | YES | OK |
| `workspace` | YES | YES | OK |
| `entity_name` | YES | YES | OK |
| `entity_type` | YES | YES | OK |
| `description` | YES | YES | OK |
| `source_chunk_ids` | YES | YES | OK |
| `user_id` | YES | YES | OK |
| `name` | NO | YES | **REMOVED** |
| `type` | NO | YES | **REMOVED** |
| `properties` | NO | YES | **REMOVED** |
| `metadata` | NO | YES | **REMOVED** |
| `mentions` | NO | YES | **REMOVED** |

#### Relations Table - Expected vs Code

| Column Name | In Database Schema | Was in Code (WRONG) | Status |
|-------------|-------------------|---------------------|--------|
| `id` | YES | YES | OK |
| `workspace` | YES | YES | OK |
| `source_entity_id` | YES | YES | OK |
| `target_entity_id` | YES | YES | OK |
| `relation_type` | YES | YES | OK |
| `description` | YES | YES | OK |
| `source_chunk_ids` | YES | YES | OK |
| `user_id` | YES | YES | OK |
| `source_entity` | NO | YES | **REMOVED** |
| `target_entity` | NO | YES | **REMOVED** |
| `properties` | NO | YES | **REMOVED** |
| `metadata` | NO | YES | **REMOVED** |
| `weight` | NO | YES | **REMOVED** |

### Code Before Fix (WRONG)

```typescript
// WRONG - These fields don't exist in schema!
const entityInsert = {
  id: entityId,
  workspace: workspace,
  name: entityData.name,  // WRONG - should be entity_name
  type: entityData.type,  // WRONG - should be entity_type
  entity_name: entityData.name,
  entity_type: entityData.type,
  description: mergedDescription,
  properties: {},           // WRONG - doesn't exist
  metadata: {},             // WRONG - doesn't exist
  mentions: entityData.sourceChunkIds.length, // WRONG - doesn't exist
  source_chunk_ids: entityData.sourceChunkIds,
};
```

### Code After Fix (CORRECT)

**File:** `src/lib/processing/entity-extractor.ts` (Lines 260-278)

```typescript
// CORRECT - Only schema-valid fields
const entityInsert: Record<string, unknown> = {
  id: entityId,
  workspace: workspace,
  entity_name: truncate(entityData.name, MAX_NAME_LENGTH),
  entity_type: truncate(entityData.type, MAX_TYPE_LENGTH),
  description: mergedDescription,
  source_chunk_ids: entityData.sourceChunkIds,
};
// Add user_id for RLS (critical for data isolation)
if (effectiveUserId) {
  entityInsert.user_id = effectiveUserId;
}
```

### Why Entities Still Show 0

Even though the schema mismatch was fixed, entities may still show 0 because:

1. **Previously processed documents:** Documents uploaded before the fix didn't have entities extracted
2. **Need to re-process:** User needs to delete and re-upload documents to trigger entity extraction
3. **Check extraction is enabled:** `ENABLE_ENTITY_EXTRACTION` env variable must not be set to 'false'

**File:** `src/lib/processing/router.ts` (Lines 13, 569-570)
```typescript
const ENABLE_ENTITY_EXTRACTION = process.env.ENABLE_ENTITY_EXTRACTION !== 'false';

// Entity extraction happens only when:
if (ENABLE_ENTITY_EXTRACTION && result.chunksCreated > 0) {
  // ... extraction code
}
```

### Proposed Additional Fix

Add a manual "Re-extract entities" button in admin panel:

```typescript
// In document actions, add:
async function reExtractEntities(documentId: string) {
  const response = await fetch(`/api/documents/${documentId}/extract-entities`, {
    method: 'POST'
  });
  // Trigger entity extraction for existing document
}
```

### Priority
**HIGH** - Core knowledge graph feature is broken

---

## Bug #3: API Requests = 2 Without API Key Creation

### Symptoms
- Dashboard shows "API Requests: 2"
- User has NOT created any API keys
- User has NOT made any external API calls

### Files Related

| File | Purpose |
|------|---------|
| `src/app/api/admin/stats/route.ts` | Stats API - calculates metrics |

### Root Cause Analysis

**IDENTIFIED:** `total_api_requests` is incorrectly using `totalMessages` (chat message count).

**File:** `src/app/api/admin/stats/route.ts` (Lines 159-173, 193-199)

```typescript
// Get chat message count (as proxy for LLM tokens) for current user
const { data: userSessions } = await supabaseAdmin
  .from('chat_sessions')
  .select('id')
  .eq('user_id', user.id);
const sessionIds = userSessions?.map(s => s.id) || [];

let totalMessages = 0;
if (sessionIds.length > 0) {
  const { count: messageCount } = await supabaseAdmin
    .from('chat_messages')
    .select('*', { count: 'exact', head: true })
    .in('session_id', sessionIds);
  totalMessages = messageCount || 0;  // This counts CHAT messages
}

// ...

usage: {
  total_api_requests: totalMessages,  // BUG: This is CHAT messages, not API requests!
  total_llm_input_tokens: tokenUsage.input,
  total_llm_output_tokens: tokenUsage.output,
  total_embedding_requests: chunksCount,
  total_storage_bytes: totalStorageBytes,
},
```

### The Problem

| Metric | Expected Source | Actual Source | Status |
|--------|-----------------|---------------|--------|
| `total_api_requests` | External API calls via API keys | Chat messages count | **WRONG** |
| `total_llm_input_tokens` | Token usage from LLM | `usage_records.llm_tokens_used` | OK |
| `total_embedding_requests` | Embedding API calls | Chunks count | OK |

### Why Shows 2

The user has made 2 chat messages in the chat interface. The code is counting chat messages instead of actual external API requests.

### Proposed Fix

**Option 1:** Track actual API requests in a new table

```sql
-- Migration to add api_requests table
CREATE TABLE api_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  api_key_id UUID REFERENCES api_keys(id),
  endpoint VARCHAR(255),
  method VARCHAR(10),
  status_code INT,
  response_time_ms INT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Option 2:** Fix the naming to be accurate

```typescript
// In src/app/api/admin/stats/route.ts
usage: {
  total_chat_messages: totalMessages,  // Rename to be accurate
  // OR remove if not needed:
  // total_api_requests: actualApiRequestCount,  // From api_requests table
  total_llm_input_tokens: tokenUsage.input,
  total_llm_output_tokens: tokenUsage.output,
  total_embedding_requests: chunksCount,
  total_storage_bytes: totalStorageBytes,
},
```

**Option 3:** Query actual API usage from `api_keys` table

```typescript
// Count API key usage if tracked
const { count: apiRequestCount } = await supabaseAdmin
  .from('api_request_logs')  // Need to create this table
  .select('*', { count: 'exact', head: true })
  .eq('user_id', user.id);

usage: {
  total_api_requests: apiRequestCount || 0,  // Actual API requests
  // ...
}
```

### Priority
**MEDIUM** - Misleading metric but doesn't affect functionality

---

## Summary

| Bug # | Issue | Root Cause | Fix Status | Priority |
|-------|-------|------------|------------|----------|
| 1 | Billing page infinite loading | API timeout / Missing error handling | NEEDS FIX | MEDIUM |
| 2 | Entities = 0, Relations = 0 | Schema mismatch in entity-extractor.ts | **FIXED** | HIGH |
| 3 | API Requests = 2 (incorrect) | Using chat messages instead of API calls | NEEDS FIX | MEDIUM |

### Recommended Actions

1. **Bug #1:** Add timeout and fallback values to billing page
2. **Bug #2:**
   - Schema mismatch already fixed
   - Re-upload documents to trigger entity extraction
   - Consider adding "Re-extract entities" feature
3. **Bug #3:** Rename metric or implement proper API request tracking

### Files Modified in This Session

| File | Changes Made |
|------|--------------|
| `src/lib/processing/entity-extractor.ts` | Removed non-existent schema fields from entity/relation inserts |
| `src/lib/processing/router.ts` | Added detailed logging for entity extraction debugging |

---

**Report Generated:** 2026-01-16 by Claude Code Analysis
