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

A Telegram bot is the wallet's companion: it answers /saldo (balance),
/kirim (send), /harga (BNB price), and pushes price alerts and transaction
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

- Repo: TODO — create `GlassWallet` repo on GitHub (nastari142) and push.
- Demo video: TODO — record the flow on a real machine/G2 (simulator tap
  input does not work in a headless VM), or build an animated demo.
- Live demo: Even Hub simulator (dev) / G2 hardware (demo day).

## Known gaps before submission

- [ ] Telegram bot live test (needs a real @BotFather token — not committed).
- [ ] Tap/scroll flow re-checked on a real machine or G2 hardware.
- [ ] Demo video recorded.
- [ ] Repo created on GitHub and pushed.
