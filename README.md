# Telegram Bot — Vercel Serverless

Two-button Telegram bot hosted on Vercel. No Python, no always-on server.

## Folder structure

```
my-bot/
├── api/
│   └── webhook.js   ← bot logic
└── vercel.json      ← config
```

---

## Deploy steps

### 1. Push to GitHub
Create a new repo and push these files.

### 2. Deploy on Vercel
1. Go to vercel.com → New Project → Import your GitHub repo
2. Click Deploy (no build settings needed)
3. Copy your deployment URL, e.g. `https://my-bot.vercel.app`

### 3. Add environment variables
In Vercel dashboard → Project → Settings → Environment Variables, add:

| Key | Value |
|-----|-------|
| `TELEGRAM_TOKEN` | your bot token from @BotFather |
| `N8N_CM_ASSIGN_ACC` | n8n webhook for Assign Accounts |
| `N8N_CM_REFRESH_ACC` | n8n webhook for Refresh Account |

Redeploy after adding env vars.

### 4. Register webhook with Telegram
Open this URL in your browser (replace values):

```
https://api.telegram.org/bot<YOUR_TOKEN>/setWebhook?url=https://<YOUR_VERCEL_URL>/api/webhook
```

Example:
```
https://api.telegram.org/bot123456:ABC-DEF/setWebhook?url=https://my-bot.vercel.app/api/webhook
```

You should see: `{"ok":true,"result":true}`

### 5. Test
Open your bot in Telegram → send `/start` → buttons appear!

---

## Webhook payloads sent to n8n

**Button 1 — Assign Accounts:**
```json
{ "tele_user_id": 123456789, "user": "username" }
```

**Button 2 — Refresh Account (after user types):**
```json
{ "tele_user_id": 123456789, "user": "username", "message": "typed text" }
```

---

## Note on state
`waitingForReply` is stored in memory. Vercel serverless functions can spin up
fresh instances, so state may reset under heavy load. For production, replace
with Vercel KV (free tier available) or Upstash Redis.
