Members CSV Import — Deploy & Test

Overview

This project includes an Edge Function `import-members` that safely imports/upserts members from a CSV. The function:
- Only allows requests from authenticated users that are `super_admin` in the `members` table (checked via the caller token)
- Rejects `auth_user_id` and `mem_id` fields to avoid accidental linking or identity tampering
- Performs `upsert(..., { onConflict: 'username' })` so rows update by `username` or insert when username is new

Prerequisites

- Supabase project and service role key
- Supabase CLI installed: https://supabase.com/docs/guides/cli
- Node.js & project dependencies if you want to run the frontend locally

Deploy Edge Function

1. Login to supabase CLI:

```bash
supabase login
```

2. From repo root, deploy the function directory `supabase/functions/import-members`:

```bash
# Set your project ref if needed: export SUPABASE_PROJECT_REF=your-ref
supabase functions deploy import-members --project-ref $SUPABASE_PROJECT_REF
```

3. Set the service role key as a secret for your project (required so the function can use the service role key):

```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="<SERVICE_ROLE_KEY>" --project-ref $SUPABASE_PROJECT_REF
```

(Ensure `SUPABASE_URL` is already available or set in the function environment by the CLI.)

Local function testing

You can serve the function locally for development. Provide env values in your shell when serving:

```bash
export SUPABASE_URL="https://<your-project>.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="<SERVICE_ROLE_KEY>"
supabase functions serve import-members
```

Then POST JSON to `http://127.0.0.1:54321/functions/v1/import-members` for local testing.

Calling the function from the frontend (production)

The frontend uses `invokeFunction('import-members', { members })` which will call the edge function endpoint and include the browser's Authorization token.

To test with curl as a super-admin user (obtain that user's access token from the browser / debug session):

```bash
curl -X POST \
  -H "Authorization: Bearer <SUPER_ADMIN_ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  "https://<project>.supabase.co/functions/v1/import-members" \
  -d '{"members": [{"username":"anitha.k","fullname":"Anitha Kumar","nic":"912345678V","gender":false,"role":"member","batch":2019,"university":"University of Colombo","school":"Science","phone":"0771234567","designation":"lecturer","uni_degree":"BSc","profile_bucket":"member-profiles","profile_path":"profiles/anitha.jpg"}] }'
```

Notes & testing guidance

- The function will return `400` if any row includes `auth_user_id` or `mem_id`.
- The function requires the caller to be authenticated; the token must belong to a user whose `members` row has `role = 'super_admin'`.
- The frontend removes `mem_id` and `auth_user_id` before invoking the function; double-check your CSV does not contain those columns.
- The frontend parsing is basic CSV (split on `,`). For robust imports across CSV variants (commas inside quotes, different newlines/encodings), consider generating a client-side preview using a CSV parser like `papaparse` before upload.

Suggested next improvements

- Add an import preview showing which rows will insert vs update and show per-row validation errors before calling the function.
- Add unit tests for the function (Deno test harness) and for the frontend CSV parsing.

If you want, I can now:
- Prepare a PR-ready test suite and example test cases, or
- Implement the import preview UI (recommended UX improvement).
