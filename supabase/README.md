# Supabase

## migrations/

SQL migrations, applied in filename order: `NNNN_description.sql`.

**This directory is currently empty** — the schema lands in Phase 2, which is
blocked on a Supabase project existing. The full schema, index and Row Level
Security plan is already written up in
[`../docs/database.md`](../docs/database.md) and is worth reviewing before the
SQL is generated.

## Rules

- Migrations are **never edited once applied.** Correct a mistake with a new
  migration, so that every environment converges on the same state by replaying
  the same files in the same order.
- Each table enables RLS in its own migration, so a table is never readable
  before its policies exist.
- Policies are grouped in `0007_rls_policies.sql` so the whole access model can
  be read in one place.

## Applying them

Migrations are **not** applied automatically by a deploy. Paste each file into
the Supabase SQL Editor in order. See [`../docs/setup.md`](../docs/setup.md)
step 5, which also includes the query to verify RLS is actually enabled on every
table afterwards.
