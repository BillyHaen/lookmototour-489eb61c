## Goal
Fix the `is_vendor_function_role_only` security finding by aligning `gear_rentals` vendor RLS policies to use `has_vendor_access()` instead of `is_vendor()`, then re-run the security scan and address any remaining issues.

## Changes

### 1. Migration: Update `gear_rentals` vendor policies
Drop and recreate the two policies currently using `is_vendor()`:

- **`Vendors view rentals of own products`** (SELECT)
- **`Vendors update rentals of own products`** (UPDATE)

Replace `is_vendor()` with `has_vendor_access()` so the check is consistent with the rest of the codebase (e.g. `products` table policies). Since `has_vendor_access()` already validates linkage via the vendors table, the explicit `EXISTS (... vendor_id = get_my_vendor_id())` subquery on `products` remains as the row-scoping guard.

```sql
DROP POLICY "Vendors view rentals of own products" ON public.gear_rentals;
DROP POLICY "Vendors update rentals of own products" ON public.gear_rentals;

CREATE POLICY "Vendors view rentals of own products"
ON public.gear_rentals FOR SELECT TO authenticated
USING (
  has_vendor_access() AND EXISTS (
    SELECT 1 FROM products p
    WHERE p.id = gear_rentals.product_id
      AND p.vendor_id = get_my_vendor_id()
  )
);

CREATE POLICY "Vendors update rentals of own products"
ON public.gear_rentals FOR UPDATE TO authenticated
USING (
  has_vendor_access() AND EXISTS (
    SELECT 1 FROM products p
    WHERE p.id = gear_rentals.product_id
      AND p.vendor_id = get_my_vendor_id()
  )
)
WITH CHECK (
  has_vendor_access() AND EXISTS (
    SELECT 1 FROM products p
    WHERE p.id = gear_rentals.product_id
      AND p.vendor_id = get_my_vendor_id()
  )
);
```

### 2. Mark finding as fixed
Mark `is_vendor_function_role_only` (scanner `supabase_lov`) as fixed with an explanation referencing the policy alignment.

### 3. Re-scan and follow-up
- Run `security--run_security_scan` and `supabase--linter` after the migration applies.
- Address any **new** `warn`/`error` findings that appear (excluding the already-known `profiles_public_readable` warn — that one was last reviewed and is intentional design for the riders directory; leave untouched unless the new scan re-prioritizes it).
- If only `profiles_public_readable` remains, report it without changes.

## Notes
- No frontend code changes needed — vendor hooks already query through these policies and will keep working identically for properly-linked vendors.
- Users with the `vendor` role but no linked vendor row will continue to be blocked (same effective behaviour as before, just enforced consistently).