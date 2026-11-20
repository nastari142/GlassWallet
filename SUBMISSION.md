# GlassWallet — DoraHacks Submission Draft

Hackathon: **Heads Up: Even Realities Hackathon by TVM Ventures & Daos Hub**
(DoraHacks, online 23–29 Nov 2026). Submission period opens 23 Nov 2026.
Team: solo — Mukhamad Nastain (Telegram @nastar142).

## Project name

**GlassWallet**

## Tagline

A crypto wallet that lives on your glasses — check your balance, send, and
confirm with a temple tap. Your phone stays in your pocket.

## Description (for the DoraHacks form)

GlassWallet is a crypto wallet app for Even Realities G2 smart glasses.
The whole flow happens on the glasses: the balance screen shows BNB + USDT
and the live BNB price; tap to send, scroll the R1 ring to pick an amount
(0.01 / 0.05 / 0.1 / 0.5 BNB), tap the temple to confirm, and the phone —
which only relays data in the background — never has to come out.

A Telegram bot is the wallet's companion: it answers /balance, /send, and
/price (BNB price), and pushes price alerts and transaction
notifications that show up on the glasses balance screen. That is the
Telegram integration: the bot and the glasses stay in sync, so an alert
you get on Telegram is already waiting on your glasses.

Built with the Even Hub SDK (Vite + TypeScript) and a zero-dependency
Node.js Telegram bot.

## What works in this build (honest)

- Full on-glasses flow verified by automated tests (23/23 pass):
  balance → send → amount cycling → confirm → sending → success →
  balance, plus cancel path and double-send guard.
- Simulator renders the balance screen with a **live BNB price** (CoinGecko).
- Telegram bot commands work against the Bot API (mock balances for the
  demo; no real funds move).
- Balances in the demo are mock numbers. The real product reads balances
  on-chain and signs on the phone / Binance Agentic Wallet — keys never
  live in the glasses app.

## Links (fill in before submitting)

- Repo: https://github.com/nastari142/GlassWallet (public, pushed 2026-11-20).
- Demo video: https://github.com/nastari142/GlassWallet/blob/main/demo-video-bento-v2.mp4 (15s, 720x900, bento-grid tour with ambient backsound; confirmed by dola 2026-11-20 as the submission video).
- Live demo: Even Hub simulator (dev) / G2 hardware (demo day).

## Known gaps before submission

- [x] Telegram bot live test — @glasswalletbot live since 2026-11-20, /start + animation verified (bot token never committed).
- [x] Tap/scroll flow re-checked on a real machine — verified by dola on his PC 2026-11-20 (full flow Balance → Send → Confirm → Sending → Success, English UI); real G2 hardware still untested.
- [x] Demo video recorded — bento v2, confirmed by dola 2026-11-20 as the submission video.
- [x] Repo created on GitHub and pushed.
