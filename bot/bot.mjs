#!/usr/bin/env node
/**
 * GlassWallet Telegram bot — COMPANION STUB (demo, no real funds).
 *
 * Plain Node.js, no dependencies. Talks to the Telegram Bot API with fetch
 * (long polling). The bot token is NEVER in this file: it comes from the
 * TELEGRAM_BOT_TOKEN environment variable.
 *
 *   TELEGRAM_BOT_TOKEN=xxx node bot/bot.mjs
 *
 * Commands:
 *   /start  — help
 *   /balance  — mock BNB + USDT balance (same demo numbers as the glasses app)
 *   /send <amount_BNB> [address] — mock send: returns a mock tx hash, and
 *           pushes the same notification to the glasses app's feed
 *           (public/notifications.json) so the simulator display updates
 *   /price  — BNB price (CoinGecko public API, read-only, mock fallback)
 *
 * Push helpers (used by the demo alert loop below):
 *   sendPriceAlert()     — BNB price alert to TELEGRAM_CHAT_ID
 *   sendTxNotification() — "transaction sent" notice to TELEGRAM_CHAT_ID
 *
 * Every Telegram message the bot sends is ALSO written to
 * public/notifications.json (latest only), which the glasses app polls every
 * 15s in dev/simulator. That file is dev plumbing only — on hardware, the
 * phone app relays Telegram messages to the glasses directly.
 *
 * SECURITY: no private keys, no seeds, no real transactions anywhere here.
 * Set DEMO_ALERTS=1 to fire one demo price alert shortly after start.
 */

import { readFileSync, writeFileSync } from 'node:fs'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || ''
const DEMO_ALERTS = process.env.DEMO_ALERTS === '1'

if (!BOT_TOKEN) {
  console.error('Missing TELEGRAM_BOT_TOKEN env var. Get one from @BotFather, then:')
  console.error('  TELEGRAM_BOT_TOKEN=<token> node bot/bot.mjs')
  process.exit(1)
}

// --- Mock wallet (same demo numbers as src/wallet.ts) -----------------------
const DEMO = {
  address: '0x408084fC409Bb91D155d0410fFb77A8d7a4fc1A1',
  addressShort: '0x4080…c1A1',
  bnb: 1.2847,
  usdt: 128.4,
  bnbUsd: 612.3,
}
const MOCK_FEE_BNB = 0.0001
let txCounter = 0

function mockTxHash() {
  txCounter += 1
  const stamp = Date.now().toString(16)
  const count = txCounter.toString(16).padStart(4, '0')
  return `0x${(stamp + count + 'glasswalletdemo').padEnd(64, '0').slice(0, 64)}`
}

const fmtUsd = (n) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const fmtBnb = (n) => n.toFixed(4)

// --- Telegram API ------------------------------------------------------------
const API = `https://api.telegram.org/bot${BOT_TOKEN}`

async function api(method, body) {
  const res = await fetch(`${API}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await res.json()
  if (!json.ok) throw new Error(`Telegram ${method} failed: ${json.description || res.status}`)
  return json.result
}

async function sendMessage(chatId, text) {
  return api('sendMessage', { chat_id: chatId, text })
}

// --- Shared notification feed for the glasses app ---------------------------
// Latest message only; the glasses app polls this file in dev/simulator.
const NOTIF_PATH = new URL('../public/notifications.json', import.meta.url)

function pushToGlasses(text) {
  try {
    writeFileSync(NOTIF_PATH, JSON.stringify({ text, at: new Date().toISOString() }, null, 2) + '\n')
  } catch (err) {
    console.error('Could not write notifications.json:', err.message)
  }
}

/** Push a notification to Telegram (if a chat is configured) AND to the glasses feed. */
async function notify(text) {
  pushToGlasses(text)
  if (!CHAT_ID) {
    console.log('[notify] no TELEGRAM_CHAT_ID set, glasses feed only:', text)
    return
  }
  try {
    await sendMessage(CHAT_ID, text)
  } catch (err) {
    console.error('[notify] Telegram send failed (glasses feed still updated):', err.message)
  }
}

async function sendPriceAlert() {
  const price = await fetchBnbPrice()
  await notify(`📈 Price alert: BNB ${fmtUsd(price)} (demo)`)
}

async function sendTxNotification(amountBnb, to, hash) {
  await notify(`✅ Sent ${fmtBnb(amountBnb)} BNB to ${to}\nTx: ${hash.slice(0, 10)}… (mock)`)
}

// --- Read-only price (CoinGecko public API, mock fallback) --------------------
async function fetchBnbPrice() {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 3000)
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=usd',
      { signal: controller.signal },
    )
    if (!res.ok) return DEMO.bnbUsd
    const json = await res.json()
    const price = json?.binancecoin?.usd
    return typeof price === 'number' && price > 0 ? price : DEMO.bnbUsd
  } catch {
    return DEMO.bnbUsd
  } finally {
    clearTimeout(timer)
  }
}

// --- Commands ------------------------------------------------------------------
async function handleCommand(chatId, text) {
  const [cmd, ...args] = text.trim().split(/\s+/)
  switch (cmd) {
    case '/start':
      return sendMessage(
        chatId,
        '👓 GlassWallet (demo)\n\n' +
          'Crypto wallet on Even G2 glasses, with this bot as its companion.\n\n' +
          '/balance — check demo balance\n' +
          '/send <amount_BNB> [address] — mock send (no real funds)\n' +
          '/price — BNB price\n\n' +
          'Confirm transactions on the glasses: tap the temple / spin the R1 ring. The phone stays in your pocket.',
      )
    case '/balance': {
      const price = await fetchBnbPrice()
      return sendMessage(
        chatId,
        `💰 Demo balance (${DEMO.addressShort})\n` +
          `BNB : ${fmtBnb(DEMO.bnb)}  (${fmtUsd(DEMO.bnb * price)})\n` +
          `USDT: ${DEMO.usdt.toFixed(2)}\n` +
          `BNB: ${fmtUsd(price)}`,
      )
    }
    case '/send': {
      const amount = Number(args[0])
      const to = args[1] || '0x1234567890abcdef1234567890abcdef12345678'
      if (!Number.isFinite(amount) || amount <= 0) {
        return sendMessage(chatId, 'Usage: /send <amount_BNB> [address]\nExample: /send 0.05')
      }
      if (amount + MOCK_FEE_BNB > DEMO.bnb) {
        return sendMessage(chatId, `Demo balance too low (balance ${fmtBnb(DEMO.bnb)} BNB).`)
      }
      DEMO.bnb = Math.max(0, DEMO.bnb - amount - MOCK_FEE_BNB)
      const hash = mockTxHash()
      const shortTo = `${to.slice(0, 6)}…${to.slice(-4)}`
      await sendTxNotification(amount, shortTo, hash)
      return sendMessage(
        chatId,
        `✅ Mock sent ${fmtBnb(amount)} BNB to ${shortTo}\n` +
          `Tx: ${hash.slice(0, 10)}…${hash.slice(-4)} (mock)\n` +
          `New balance: ${fmtBnb(DEMO.bnb)} BNB\n` +
          `The same notification was sent to the glasses.`,
      )
    }
    case '/price': {
      const price = await fetchBnbPrice()
      return sendMessage(chatId, `BNB: ${fmtUsd(price)} (demo)`)
    }
    default:
      return sendMessage(chatId, 'Unknown command. Try /start, /balance, /send, /price.')
  }
}

// --- Long polling --------------------------------------------------------------
let offset = 0

async function poll() {
  try {
    const res = await fetch(`${API}/getUpdates?offset=${offset}&timeout=25`)
    const json = await res.json()
    if (!json.ok) throw new Error(json.description || 'getUpdates failed')
    for (const update of json.result || []) {
      offset = update.update_id + 1
      const msg = update.message
      if (msg?.text?.startsWith('/')) {
        await handleCommand(msg.chat.id, msg.text).catch((err) =>
          console.error('Command failed:', err.message),
        )
      }
    }
  } catch (err) {
    console.error('Poll error (retrying):', err.message)
    await new Promise((r) => setTimeout(r, 3000))
  }
  setImmediate(poll)
}

console.log('GlassWallet bot stub running (demo, no real funds).')
console.log('Commands: /start /balance /send /price')
if (!CHAT_ID) console.log('Note: TELEGRAM_CHAT_ID not set — push alerts go to the glasses feed only.')
if (DEMO_ALERTS) {
  setTimeout(() => void sendPriceAlert().catch((e) => console.error(e.message)), 10000)
}
void poll()
