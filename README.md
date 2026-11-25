# Papitostocks

**Private Wealth & Global Intelligence** · *Understand the world. Understand the markets.*

A private investment and market-intelligence app, built on Alpaca paper trading. Italian and English, light and dark mode.

- Technical plan, costs and roadmap: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- Database schema: [`supabase/schema.sql`](supabase/schema.sql)

## Go live on Vercel (existing project)

The Vercel project that hosted the old app deploys this one automatically when `main` changes. `vercel.json` tells Vercel it is a Next.js app.

1. Vercel → your project → **Settings → Environment Variables**. Make sure these exist:
   | Name | Value |
   |---|---|
   | `ALPACA_KEY_ID` | Alpaca **paper** Key ID (already added) |
   | `ALPACA_SECRET_KEY` | Alpaca **paper** Secret (already added) |
   | `APP_PASSCODE` | The access code you and your father will type |
   | `SESSION_SECRET` | A long random string (40+ characters, just mash the keyboard) |
2. **Deployments → ⋯ → Redeploy** so the new variables are picked up.
3. Open the site: you'll see the Papitostocks login page. Enter the passcode.
4. If the red **DEMO** badge shows in the top bar, the Alpaca keys aren't being read: check their names in step 1.

### If the deploy fails
Vercel → Settings → **Build and Deployment**: Framework Preset should be **Next.js**, and Build/Output/Install commands should be empty (default). Then redeploy.

## Run it on your own computer (optional)

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev                  # open http://localhost:3000
```

Without Alpaca keys the app runs in clearly labelled **demo mode**.

## Safety

- Paper trading only: the code can only reach `paper-api.alpaca.markets`. Live trading is not wired up (Phase 7).
- All keys stay on the server; the browser never receives them.
- Orders need a review dialog and confirmation. They are checked for size limits (`MAX_ORDER_NOTIONAL`, `MAX_ORDER_QTY`) and buying power, and get a unique ID so they can't be sent twice. Set `TRADING_DISABLED=true` to stop all orders instantly.
- AI features (Phase 4) will never be able to place orders.
