# GlassWallet — Crypto Wallet on Even Realities G2 Smart Glasses

Hackathon demo for the **Even Realities Hackathon** (online, 23–29 Nov 2026,
DoraHacks): a crypto wallet that lives on Even G2 smart glasses, with a
Telegram bot as its companion. **The whole flow happens on the glasses** —
check balance, pick an amount, confirm by tapping the temple — the phone
stays in the pocket (it only relays data in the background).

> **Demo/scaffold stage. No real funds, no real keys, no real transactions.**
> Balances are hard-coded mock numbers. The only live call is a read-only
> BNB price fetch (CoinGecko public API) with a mock fallback.

## Demo video

- **Full demo (82 s, narrated):** [GlassWallet — Full Demo | Crypto Wallet on Even Realities G2 Smart Glasses](https://www.youtube.com/watch?v=ppVgewcjkYI) — the problem, the full on-glasses flow (balance → send → confirm), the Telegram bot companion, and the tech stack. File in this repo: `demo-video-detailed-v1.mp4`.
- **Short version (15 s, silent):** `demo-video-bento-v2.mp4` — bento-grid tour of the 8 features.

## What existed before Nov 23, 2026

Per the hackathon rules (build during the hackathon; say in the README what
existed before Nov 23):

- **Built before the hackathon (20 Nov 2026):** the glasses app (Even Hub SDK, Vite + TypeScript, full balance → send → confirm flow), the Telegram bot @glasswalletbot (`/balance`, `/send`, `/price`), and the 15 s demo video v2.
- **Built during the hackathon (23 Nov 2026):** the detailed 82 s demo video v1 and the DoraHacks Build page.

## The flow (on the 576×288 glasses canvas)

| Screen | What you see | Input |
|---|---|---|
| Balance | BNB + USDT (mock), BNB price, demo address, latest Telegram alert | Tap → Send |
| Send | Recipient `0x1234…5678`, amount preset | R1 ring scroll → change amount (0.01 / 0.05 / 0.1 / 0.5 BNB); scroll up → back; tap → Confirm |
| Confirm | Amount, recipient, mock fee | **Tap temple / R1 ring → confirm**; scroll up → cancel |
| Sending | "Menandatangani di kacamata…" | — (phone stays in pocket) |
| Success | Mock tx hash, new balance | Tap → back to Balance |

Double-tap anywhere exits (system confirmation, as required on the root page).
Voice confirm is planned (ASR) — not in this scaffold.

## Telegram bot companion (`bot/bot.mjs`)

Plain Node.js, zero dependencies, Bot API via `fetch` (long polling).

```bash
cp bot/.env.example bot/.env   # then fill in TELEGRAM_BOT_TOKEN from @BotFather
TELEGRAM_BOT_TOKEN=<token> npm run bot
# optional: TELEGRAM_CHAT_ID=<chat id> DEMO_ALERTS=1
```

Commands: `/start`, `/balance` (mock balance), `/send <amount_BNB> [address]`
(mock send — returns a mock tx hash), `/price` (BNB price).

Every message the bot sends is also written to `public/notifications.json`,
which the glasses app polls every 15 s in dev/simulator — so a price alert
or tx notification from the bot shows up on the glasses balance screen.
That file is **dev plumbing only**: on real hardware the phone app relays
Telegram messages to the glasses directly. The token lives only in the
environment, never in code or files.

## Run it

```bash
npm install
npm run dev          # terminal 1 — Vite dev server on :5173
npm run simulate     # terminal 2 — evenhub-simulator http://localhost:5173
```

Real glasses: `npx evenhub qr --url http://<your-LAN-IP>:5173`, scan the QR
from the Even Hub companion app (Developer Mode on).

Package for distribution: `npm run pack` (builds, then `evenhub pack`).

## Project layout

```
app.json                  Even Hub manifest (package com.dola.glasswallet)
src/main.ts               Glasses UI: screens + tap/ring event routing
src/wallet.ts             Mock wallet state, mock send, read-only price fetch
bot/bot.mjs               Telegram bot stub (no deps, token via env only)
bot/.env.example          Env template — never put a real token in the repo
public/icon.png           24x24 greyscale app icon
public/notifications.json Shared alert feed (bot -> glasses, dev only)
```

## Mock vs real

| Piece | This scaffold | Real product (next steps) |
|---|---|---|
| Balances | Hard-coded (1.2847 BNB, 128.40 USDT) | BSC `balanceOf` via phone relay |
| Price | CoinGecko public API, mock fallback | Same (read-only) |
| Send | `mockSend()` — deducts locally, fake tx hash | Sign on phone secure element / Binance Agentic Wallet, broadcast real tx |
| Confirm | Temple tap / R1 ring | Same + voice (ASR) |
| Telegram | Bot stub + `notifications.json` feed | Phone app relays bot messages to glasses |
| Keys | None exist anywhere in this repo | Never stored in the app; signing stays on the phone/wallet |

## Verification status (2026-11-20, this VM)

- ✅ `npm install` — 83 packages, exit 0 (SDK `@evenrealities/even_hub_sdk@0.0.10`).
- ✅ `npm run build` — `tsc --noEmit && vite build`, exit 0 (`dist/` 73.24 kB JS).
- ✅ `npm test` — `node test/flow-test.ts`, **23/23 PASS**: full
  balance → send → amount cycling → confirm → sending → success → balance
  flow, cancel path, amount kept after cancel, busy guard (no double-send),
  balance deduction incl. mock fee.
- ✅ Simulator renders the app — screenshot-verified on the 576×288 canvas:
  balance screen with **live BNB price ($571.80 from CoinGecko)** and the
  Telegram alert line. Simulator needed system libs that were missing here
  (`libwebkit2gtk-4.1`, `libsoup-3.0`, `libjavascriptcoregtk-4.1` + ~45
  deps); they were installed from the Ubuntu archive via direct .deb
  download (`/tmp/simdebs/`), and the simulator runs under `xvfb-run`.
- ⚠️ Simulator input injection does NOT work in this headless Xvfb
  environment: neither its Click/Down buttons nor direct canvas clicks
  deliver events to the app — **verified with the official `minimal`
  template too** (counter never increments), so it is not a GlassWallet
  bug. The tap/scroll flow is therefore verified by `npm test` instead.
  **Please re-check the flow on a real machine** (`npm run dev` +
  `npm run simulate`, click Click/Down) or on real G2 hardware before demo
  day; if clicks work there, no code change is needed.
- ⚠️ Bot stub: `node --check` passes; without `TELEGRAM_BOT_TOKEN` it exits
  with a clear message. A live run against the Bot API still needs a real
  token from @BotFather (never committed).

## Notes / known limits

- The glasses app fetches `./notifications.json` and the CoinGecko price
  from the WebView; `app.json` whitelists `https://api.coingecko.com` under
  the `network` permission. The notifications feed is same-origin in dev.
- Amount entry is preset-based (ring scroll cycles 0.01/0.05/0.1/0.5 BNB):
  there is no keyboard on glasses. A custom-amount voice entry is a
  follow-up (ASR template).
- No real G2 hardware was available for this scaffold; the tap/ring event
  mapping follows the SDK's `OsEventTypeList` / `EventSourceType` types
  (temple R/L vs R1 ring are distinguishable via `sysEvent.eventSource`).
