/**
 * Mock wallet — DEMO ONLY. No real keys, no real funds, no real network
 * calls that move anything. All balances are hard-coded demo numbers.
 *
 * The one live call in this file is a READ-ONLY price fetch from CoinGecko's
 * public API (no key). It always falls back to MOCK_BNB_USD on any failure,
 * so the glasses UI never blocks on the network.
 */

/** Demo wallet address shown on the balance screen (public address, demo). */
export const DEMO_ADDRESS = '0x408084fC409Bb91D155d0410fFb77A8d7a4fc1A1'
export const DEMO_ADDRESS_SHORT = '0x4080…c1A1'

/** Fixed demo recipient for the send flow. */
export const DEMO_RECIPIENT = '0x1234567890abcdef1234567890abcdef12345678'
export const DEMO_RECIPIENT_SHORT = '0x1234…5678'

/** Amount presets cycled with the R1 ring (scroll events). */
export const AMOUNT_PRESETS_BNB = [0.01, 0.05, 0.1, 0.5]

/** Mock fee shown on the confirmation screen. */
export const MOCK_FEE_BNB = 0.0001

export const MOCK_BNB_USD = 612.3

export interface WalletState {
  bnb: number
  usdt: number
  bnbUsd: number
}

export const wallet: WalletState = {
  bnb: 1.2847,
  usdt: 128.4,
  bnbUsd: MOCK_BNB_USD,
}

/** Read-only BNB price. Returns the live price or the mock fallback. */
export async function refreshBnbPrice(): Promise<number> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 3000)
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=usd',
      { signal: controller.signal },
    )
    if (!res.ok) return MOCK_BNB_USD
    const json = (await res.json()) as { binancecoin?: { usd?: number } }
    const price = json?.binancecoin?.usd
    return typeof price === 'number' && price > 0 ? price : MOCK_BNB_USD
  } catch {
    return MOCK_BNB_USD
  } finally {
    clearTimeout(timer)
  }
}

export interface MockTx {
  hash: string
  hashShort: string
  amountBnb: number
  newBnbBalance: number
}

let txCounter = 0

function mockTxHash(): string {
  txCounter += 1
  const stamp = Date.now().toString(16)
  const count = txCounter.toString(16).padStart(4, '0')
  const body = (stamp + count + 'glasswalletdemo').padEnd(64, '0').slice(0, 64)
  return `0x${body}`
}

/**
 * Simulates a send. Waits ~900 ms (as if signing on the glasses), then
 * deducts the amount + mock fee from the mock balance. Nothing is broadcast.
 */
export async function mockSend(amountBnb: number): Promise<MockTx> {
  await new Promise((resolve) => setTimeout(resolve, 900))
  wallet.bnb = Math.max(0, wallet.bnb - amountBnb - MOCK_FEE_BNB)
  const hash = mockTxHash()
  return {
    hash,
    hashShort: `${hash.slice(0, 6)}…${hash.slice(-4)}`,
    amountBnb,
    newBnbBalance: wallet.bnb,
  }
}

export function fmtUsd(n: number): string {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function fmtBnb(n: number): string {
  return n.toFixed(4)
}
