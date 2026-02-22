# Runbook: WhatsApp Pairing

Operations guide for pairing and managing WhatsApp connection with OpenClaw inspector service.

## Overview

The inspector service uses WhatsApp Web (via Baileys) to receive messages. This requires a one-time QR code scan to link the service to a WhatsApp account. Auth tokens are stored in a persistent volume.

## Initial Pairing

### Prerequisites
- Service deployed and running on Railway
- Access to WhatsApp on phone (account to be linked)
- Railway CLI installed (`npm i -g @railway/cli`)

### Steps

1. **SSH into the service**
   ```bash
   railway run bash --service openclaw-inspector
   ```

2. **Start pairing**
   ```bash
   openclaw whatsapp pair
   ```

3. **Scan QR code**
   - QR code displays in terminal
   - Open WhatsApp on phone
   - Go to Settings → Linked Devices → Link a Device
   - Scan the QR code

4. **Verify connection**
   ```bash
   openclaw whatsapp status
   ```
   Should show: `Connected: +64 21 XXX XXXX`

5. **Exit SSH**
   ```bash
   exit
   ```

## Re-Pairing

Required when:
- WhatsApp session expires (rare, usually months)
- Phone logged out linked devices
- Volume was reset/deleted

### Steps

1. SSH into service (see above)

2. Clear existing auth (if needed)
   ```bash
   rm -rf /app/auth/*
   ```

3. Run pairing again
   ```bash
   openclaw whatsapp pair
   ```

4. Scan new QR code

## Monitoring Connection

### Health Check

The service exposes connection status via health endpoint:

```bash
curl https://openclaw-inspector.up.railway.app/health
```

Response includes:
```json
{
  "status": "healthy",
  "whatsapp": {
    "connected": true,
    "phone": "+64 21 XXX XXXX"
  }
}
```

### Logs

Watch for disconnection events:

```bash
railway logs -f --service openclaw-inspector | grep -i whatsapp
```

Common log patterns:
- `WhatsApp connected` — Good
- `WhatsApp disconnected: connection_lost` — Network issue, will auto-reconnect
- `WhatsApp disconnected: logged_out` — Needs re-pairing
- `WhatsApp disconnected: replaced` — Another device linked, needs re-pairing

### Alerts (Future)

Configure Railway notifications for:
- Service restart events
- Health check failures
- Log pattern: `logged_out` or `replaced`

## Session Persistence

### Volume Mount
Auth tokens stored at `/app/auth` (Railway volume).

### Backup Auth (Optional)
```bash
# Download auth backup
railway run tar -czf - /app/auth > whatsapp-auth-backup.tar.gz

# Restore (after volume reset)
cat whatsapp-auth-backup.tar.gz | railway run tar -xzf - -C /
```

## Troubleshooting

### QR Code Not Displaying
- Check terminal supports Unicode
- Try: `openclaw whatsapp pair --format ascii`

### QR Code Expires Before Scanning
- QR codes expire in ~60 seconds
- Have phone ready before starting
- Run `openclaw whatsapp pair` again for new code

### "Session Conflict" Error
- Another instance is using the same auth
- Ensure only one replica running
- Clear auth and re-pair

### Phone Shows "WhatsApp Web is Active" But Service Disconnected
- Auth tokens may be corrupted
- Clear auth and re-pair:
  ```bash
  rm -rf /app/auth/*
  openclaw whatsapp pair
  ```

### Messages Not Arriving
1. Check connection: `openclaw whatsapp status`
2. Check logs for errors
3. Verify phone number in allowlist (openclaw.yml)
4. Test with: `openclaw whatsapp send +64XXXXXXXXX "test"`

## Security Notes

- Auth tokens give full access to WhatsApp account
- Volume should not be shared between services
- Consider dedicated phone number for production
- Phone can revoke access anytime via "Linked Devices"
