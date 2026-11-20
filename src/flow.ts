/**
 * GlassWallet screen flow — pure logic, no SDK imports, so it can be
 * unit-tested with plain Node (`node test/flow-test.ts`).
 *
 * Screens: balance -> send -> confirm -> sending -> success -> balance
 *   tap         = primary action (advance / confirm)
 *   scrollDown  = next amount preset (send screen only)
 *   scrollUp    = back / cancel
 */
import {
  AMOUNT_PRESETS_BNB,
  DEMO_ADDRESS_SHORT,
  DEMO_RECIPIENT_SHORT,
  MOCK_FEE_BNB,
  fmtBnb,
  fmtUsd,
  wallet,
  type MockTx,
} from './wallet.ts'

export type Screen = 'balance' | 'send' | 'confirm' | 'sending' | 'success'

export interface FlowState {
  screen: Screen
  amountIndex: number
  lastTx: MockTx | null
  busy: boolean
  latestNotif: string
}

export function createFlow(): FlowState {
  return {
    screen: 'balance',
    amountIndex: 0,
    lastTx: null,
    busy: false,
    latestNotif: 'Telegram: alert harga BNB aktif',
  }
}

export function amountOf(s: FlowState): number {
  return AMOUNT_PRESETS_BNB[s.amountIndex]
}

export function renderFlow(s: FlowState): string {
  switch (s.screen) {
    case 'balance':
      return [
        'GLASSWALLET  (demo - no real funds)',
        `Saldo BNB : ${fmtBnb(wallet.bnb)}  (${fmtUsd(wallet.bnb * wallet.bnbUsd)})`,
        `Saldo USDT: ${wallet.usdt.toFixed(2)}`,
        `BNB: ${fmtUsd(wallet.bnbUsd)}`,
        `Alamat: ${DEMO_ADDRESS_SHORT}`,
        s.latestNotif,
        '',
        'Ketuk: Kirim  |  Ketuk 2x: Keluar',
      ].join('\n')
    case 'send':
      return [
        'KIRIM BNB',
        `Ke: ${DEMO_RECIPIENT_SHORT}`,
        '',
        `Jumlah: ${fmtBnb(amountOf(s))} BNB (${fmtUsd(amountOf(s) * wallet.bnbUsd)})`,
        `Saldo: ${fmtBnb(wallet.bnb)} BNB`,
        '',
        'Putar ring: ganti jumlah',
        'Ketuk: Lanjut  |  Ring ke atas: kembali',
      ].join('\n')
    case 'confirm':
      return [
        'KONFIRMASI - cek dulu!',
        '',
        `Kirim: ${fmtBnb(amountOf(s))} BNB (${fmtUsd(amountOf(s) * wallet.bnbUsd)})`,
        `Ke   : ${DEMO_RECIPIENT_SHORT}`,
        `Biaya: ~${fmtBnb(MOCK_FEE_BNB)} BNB (mock)`,
        '',
        'KETUK KACAMATA untuk konfirmasi',
        'Ring ke atas: batal',
      ].join('\n')
    case 'sending':
      return [
        'Mengirim...',
        '',
        `Menandatangani ${fmtBnb(amountOf(s))} BNB di kacamata...`,
        'HP tetap di saku.',
      ].join('\n')
    case 'success':
      return [
        'BERHASIL ✓',
        '',
        `${fmtBnb(s.lastTx?.amountBnb ?? 0)} BNB terkirim (mock)`,
        `Tx: ${s.lastTx?.hashShort ?? '-'}`,
        `Saldo baru: ${fmtBnb(wallet.bnb)} BNB`,
        '',
        'Ketuk: kembali ke saldo',
      ].join('\n')
  }
}

/** Primary action (temple tap / R1 ring click). `send` is injected so tests can stub it. */
export async function tap(
  s: FlowState,
  send: (amountBnb: number) => Promise<MockTx>,
): Promise<void> {
  if (s.busy) return
  switch (s.screen) {
    case 'balance':
      s.screen = 'send'
      return
    case 'send':
      s.screen = 'confirm'
      return
    case 'confirm': {
      s.busy = true
      s.screen = 'sending'
      s.lastTx = await send(amountOf(s))
      s.busy = false
      s.screen = 'success'
      return
    }
    case 'success':
      s.screen = 'balance'
      return
    case 'sending':
      return
  }
}

/** R1 ring scroll down: next amount preset (send screen only). */
export function scrollDown(s: FlowState): void {
  if (s.busy) return
  if (s.screen === 'send') {
    s.amountIndex = (s.amountIndex + 1) % AMOUNT_PRESETS_BNB.length
  }
}

/** R1 ring scroll up: back / cancel. */
export function scrollUp(s: FlowState): void {
  if (s.busy) return
  if (s.screen === 'send') s.screen = 'balance'
  else if (s.screen === 'confirm') s.screen = 'send'
}
