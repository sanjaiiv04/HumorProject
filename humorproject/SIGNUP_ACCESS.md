# Signup access

Apply the admin repository's `supabase/migrations/202610260002_signup_access.sql` to the shared Supabase project, then deploy this CapRate update. Deploy both for non-Columbia access to work.

An email qualifies if it matches the original Columbia UNI regex (`^[a-z]{2,3}[0-9]{1,4}@columbia\.edu$`), an active exact domain, or an active exact whitelisted email. Matching ignores case. Domains do not include subdomains automatically. No domain is seeded: adding `columbia.edu` deliberately broadens the original UNI rule to all addresses at that domain.

The database trigger applies the policy before creating an auth user. The OAuth callback checks the authenticated user's eligibility through a no-argument RPC. The RPC reads the actual auth user and permits existing superadmins as well. It exposes no email list and grants no privileges. The existing profile trigger is unchanged; non-Columbia users have a null UNI and ordinary privileges. UNI-based friend lookup still requires a UNI.

If the RPC fails, the original Columbia UNI rule continues to work; additional access fails closed. Deactivating/deleting entries changes future sign-ins, not existing sessions. This is signup/sign-in eligibility, not immediate session revocation. The existing Google OAuth configuration is unchanged.

Verify with a Columbia UNI account, a whitelisted external account, an account at an active external domain, and an unrelated blocked account. Deactivate the external entry and sign out before checking denial. Do not add real external accounts just to test the migration: the SQL regression script uses transaction-local fixtures and rolls back.
