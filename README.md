# Le mie azioni (My Stocks): a simple, large-print stock app

A big-text, plain-language stock app for Android phones and Windows computers, built for use in **Italy**:

- Opens in **Italian**, with an English switch in *Impostazioni* (Settings).
- Prices are in US dollars, with an **approximate euro amount** next to them (daily European Central Bank rate, free, no key).
- US market hours are shown in **local time** (open 15:30–22:00 in Italy).
- Only US-listed stocks are available, which includes Italian companies like Ferrari (RACE), Stellantis (STLA) and Eni (E).
- The scam-warning section points to Consob, Italy's market regulator.
It uses an **Alpaca paper-trading account**, so all trades are practice money at real prices.

**Screens (Italian names):** Home · Azioni · Storico · Impara · Impostazioni.

**Screens:** Home (account value, what you own) · Stocks (search by company name, watch list, charts)
· History (past trades) · Learn (basics, good habits, scam warnings) · Settings (text size, high contrast).

## How it works

```
Phone / PC browser  →  your website (index.html, app.js)
                    →  /api/alpaca  (small server function that holds the Alpaca keys)
                    →  Alpaca paper-trading + market data
```

The keys stay on the server, so nobody can read them from the phone. The server function talks
**only** to `paper-api.alpaca.markets`, so it cannot place real-money trades.

If the server isn't set up, the app runs with **sample numbers**, which is handy for previewing.

## Setup (about 15 minutes, free)

1. **Get Alpaca keys.** Sign up at https://alpaca.markets (you only need an email for a paper-only account; you set it up, not Dad). In the dashboard, switch to
   **Paper Trading**, then click **Generate New Keys** under *API Keys*. Copy the *Key ID* and the *Secret Key*.
2. **Put this folder on GitHub** (a new private repo is fine).
3. **Deploy on Vercel** (free): https://vercel.com → *Add New → Project* → import the repo → keep default settings.
4. In Vercel go to **Settings → Environment Variables** and add:
   - `ALPACA_KEY_ID`: your paper Key ID
   - `ALPACA_SECRET_KEY`: your paper Secret Key
   - `APP_PASSCODE` (optional, recommended): any word or number. Enter it once in the app's Settings.
     This stops strangers who find the link from using the account.
5. Click **Redeploy**. Open the `https://….vercel.app` link: the yellow "sample numbers" banner should be gone.

## Putting it on Dad's devices

- **Android (Chrome):** open the link → ⋮ menu → **Add to Home screen**. It opens like a regular app.
- **Windows (Edge/Chrome):** open the link → ⋯ menu → **Apps → Install this site as an app**, or pin it to the taskbar.
- In the app's **Settings**, pick *Larger* or *Largest* text if needed.

## Preview locally

```bash
python3 -m http.server 8000
```
Then open http://localhost:8000 (sample mode).
