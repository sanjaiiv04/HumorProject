# Signup access

Apply the admin repository migrations through `202610270001_list_only_signup.sql`, then deploy this CapRate update. Ordinary users qualify only through an active exact domain or an active exact whitelisted email. Matching ignores case; domains do not include subdomains automatically. Columbia has no built-in access exception: keep `columbia.edu` active if Columbia users should qualify.

The database signup trigger checks the lists before creating an auth user. The OAuth callback checks the actual authenticated user through the no-argument `current_user_signup_allowed()` RPC. Existing users with the protected `is_superadmin` flag retain sign-in access regardless of the lists. No list entry grants admin privileges. No account flags or existing sessions are changed.

If the RPC fails, sign-in fails closed for every email. Removing or disabling entries changes future sign-ins; it does not revoke existing sessions. The profile trigger still derives UNI metadata for Columbia accounts; that is not an access exception. UNI-based friend lookup is unchanged.

Test with a non-superadmin Columbia account and an approved external account. Deactivate a domain, sign out, and check that sign-in is denied unless an exact email entry still allows it. Then reactivate the domain. Superadmin accounts deliberately cannot demonstrate ordinary-user denial. Database regression tests use transaction-local fixtures and roll back all changes.
