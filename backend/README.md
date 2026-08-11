# indic-compose-backend

Stateless proxy. One endpoint, `POST /complete`, forwards `{system, messages}` to Sarvam Chat with streaming and pipes the SSE stream back to the browser. Keeps `SARVAM_API_KEY` server-side.

## Setup

```bash
cd backend
cp .env.example .env       # then edit .env and paste your real key
npm install
npm run dev                # node --watch, restarts on save
```

Server listens on `http://localhost:8787` by default.

## Verify

```bash
curl http://localhost:8787/health
# → {"ok":true,"hasKey":true,"model":"sarvam-m"}
```

## Notes

- The default Sarvam chat URL is `https://api.sarvam.ai/v1/chat/completions`. If your account uses a different endpoint, override with `SARVAM_CHAT_URL` in `.env`.
- If you want to swap to Anthropic Claude or Groq, this is the one file to change.
