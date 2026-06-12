# Clerk DNS Diagnostic

If navigation is slow or users appear to be signed out, check the dev server
terminal for this error:

```
getaddrinfo EAI_AGAIN api.clerk.com
```

That means the machine cannot resolve Clerk's API hostname. Auth calls then
fail or time out, which causes delays and redirects to `/sign-in`.

## Steps to fix

1. **Check internet connection** — ensure the machine has stable network access.

2. **Test DNS resolution:**
   ```powershell
   nslookup api.clerk.com
   ```
   If this fails, the issue is local DNS.

3. **Change DNS to a public resolver:**
   - Google: `8.8.8.8` / `8.8.4.4`
   - Cloudflare: `1.1.1.1` / `1.0.0.1`
   - Windows: **Settings → Network & Internet → Wi‑Fi/Ethernet → DNS → Manual → 8.8.8.8**

4. **Optional hosts-file workaround** (if DNS keeps failing):
   ```powershell
   nslookup api.clerk.com 8.8.8.8
   ```
   Copy the returned IP, then add to `C:\Windows\System32\drivers\etc\hosts` (as Administrator):
   ```
   [IP ADDRESS] api.clerk.com
   ```

5. **Restart the dev server** after fixing DNS:
   ```powershell
   pnpm dev
   ```

6. **Verify** — click admin nav links (e.g. Students). Pages should load in
   under ~1 second and the terminal should no longer show `EAI_AGAIN` errors.
