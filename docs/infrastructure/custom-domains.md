# Custom Domain & DNS Setup

This guide documents the domain configuration for the AI Inspection platform.

## Domain Structure

| Environment | Frontend | Backend |
|-------------|----------|---------|
| **Production** | `app-ai-inspection.apexphere.co.nz` | `api-ai-inspection.apexphere.co.nz` |
| **Test** | `app-test-ai-inspection.apexphere.co.nz` | `api-test-ai-inspection.apexphere.co.nz` |

## Why Custom Domains?

Using subdomains under `apexphere.co.nz` enables **same-site cookie authentication**:
- Keeps `SameSite=Strict` (most secure)
- No CSRF exposure
- Cookies shared across `app-*` and `api-*` subdomains

See [Issue #113](https://github.com/apexphere/ai-inspection/issues/113) for background.

---

## DNS Configuration (Google Admin Console)

### Navigate To
```
admin.google.com → Domains → Manage domains → apexphere.co.nz → DNS
```

### CNAME Records

| Host name | Type | TTL | Data |
|-----------|------|-----|------|
| `app-ai-inspection` | CNAME | 3600 | `cname.vercel-dns.com` |
| `app-test-ai-inspection` | CNAME | 3600 | `cname.vercel-dns.com` |
| `api-ai-inspection` | CNAME | 3600 | `ai-inspection.fly.dev` |
| `api-test-ai-inspection` | CNAME | 3600 | `ai-inspection-test.fly.dev` |

> **Note:** Only enter the subdomain part (e.g., `app-ai-inspection`). Google appends `.apexphere.co.nz` automatically.

---

## Vercel Configuration

### 1. Add Custom Domains

```
Project Settings → Domains → Add:
  - app-ai-inspection.apexphere.co.nz
  - app-test-ai-inspection.apexphere.co.nz
```

### 2. Branch Mapping

| Domain | Git Branch | Environment |
|--------|------------|-------------|
| `app-ai-inspection.apexphere.co.nz` | `main` | Production |
| `app-test-ai-inspection.apexphere.co.nz` | `develop` | Preview |

### 3. Environment Variables

```
Project Settings → Environment Variables:

VITE_API_URL
  Production: https://api-ai-inspection.apexphere.co.nz
  Preview:    https://api-test-ai-inspection.apexphere.co.nz
```

---

## Fly.io Configuration

### 1. Add Certificates

```bash
# Production
fly certs add api-ai-inspection.apexphere.co.nz -a ai-inspection

# Test
fly certs add api-test-ai-inspection.apexphere.co.nz -a ai-inspection-test
```

### 2. Verify Certificates

```bash
fly certs show api-ai-inspection.apexphere.co.nz -a ai-inspection
# Wait for Status: Ready (1-5 minutes)
```

### 3. List All Certificates

```bash
fly certs list -a ai-inspection
```

---

## Application Code Changes

### Cookie Configuration (API)

```python
response.set_cookie(
    'token',
    value=token,
    domain='.apexphere.co.nz',  # Leading dot = all subdomains
    samesite='strict',
    secure=True,
    httponly=True
)
```

### CORS Configuration (API)

```python
ALLOWED_ORIGINS = [
    'https://app-ai-inspection.apexphere.co.nz',
    'https://app-test-ai-inspection.apexphere.co.nz',
]
```

---

## Verification

### DNS Propagation (5-30 minutes)

```bash
# Check CNAME records
dig app-ai-inspection.apexphere.co.nz CNAME
dig api-ai-inspection.apexphere.co.nz CNAME

# Expected: points to vercel/fly.dev
```

### SSL Certificates

- **Vercel:** Automatic — check for ✓ in dashboard
- **Fly.io:** Run `fly certs show <domain>` → Status: Ready

### Auth Flow Test

1. Open `https://app-test-ai-inspection.apexphere.co.nz`
2. Login → cookie should be set with `Domain=.apexphere.co.nz`
3. Navigate to protected page → cookie sent, no 401
4. Check DevTools → Network → Request Headers → `Cookie: token=...`

---

## Troubleshooting

### Cookie Not Sent

- Verify `Domain=.apexphere.co.nz` in Set-Cookie header
- Check `SameSite`, `Secure`, `HttpOnly` flags
- Ensure both frontend and API use HTTPS

### CORS Errors

- Verify origin in CORS allowlist matches exactly (including `https://`)
- Check `credentials: 'include'` in frontend fetch calls

### DNS Not Resolving

- Wait up to 48 hours for propagation (usually <30 min)
- Clear local DNS cache: `sudo dscacheutil -flushcache` (macOS)
- Try different DNS resolver: `dig @8.8.8.8 <domain>`

---

## Related

- [Issue #113 - Cross-origin cookies bug](https://github.com/apexphere/ai-inspection/issues/113)
- [Issue #115 - Custom domain implementation](https://github.com/apexphere/ai-inspection/issues/115)
