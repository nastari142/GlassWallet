/**
 * Flow test — drives the GlassWallet screen state machine (src/flow.ts)
 * with the real mockSend from src/wallet.ts, no SDK/bridge needed.
 * Run: node test/flow-test.ts   (Node >= 22 type-strips .ts)
 */
import { createFlow, renderFlow, scrollDown, scrollUp, tap } from '../src/flow.ts'
import { MOCK_FEE_BNB, mockSend, wallet } from '../src/wallet.ts'

let failures = 0
function check(name: string, cond: boolean, extra = ''): void {
  if (cond) {
    console.log(`PASS ${name}`)
  } else {
    failures += 1
    console.log(`FAIL ${name} ${extra}`)
  }
}
function has(text: string, needle: string): boolean {
  return text.includes(needle)
}

const startBnb = wallet.bnb
const f = createFlow()

// 1. Balance screen
let out = renderFlow(f)
check('balance shows GLASSWALLET', has(out, 'GLASSWALLET'))
check('balance shows mock BNB', has(out, '1.2847'))
check('balance shows notif line', has(out, 'Telegram:'))

// 2. Tap -> send screen, default amount = first preset (0.01)
await tap(f, mockSend)
out = renderFlow(f)
check('tap balance -> send', f.screen === 'send', f.screen)
check('send shows recipient', has(out, '0x1234…5678'))
check('send default amount 0.0100', has(out, '0.0100 BNB'), out.split('\n')[3])

// 3. Ring scroll cycles presets 0.01 -> 0.05 -> 0.1 -> 0.5 -> wraps to 0.01
scrollDown(f)
check('scroll -> 0.05', has(renderFlow(f), '0.0500 BNB'))
scrollDown(f)
check('scroll -> 0.10', has(renderFlow(f), '0.1000 BNB'))
scrollDown(f)
check('scroll -> 0.50', has(renderFlow(f), '0.5000 BNB'))
scrollDown(f)
check('scroll wraps -> 0.01', has(renderFlow(f), '0.0100 BNB'))

// 4. Scroll up from send -> back to balance
scrollUp(f)
check('scroll up from send -> balance', f.screen === 'balance', f.screen)

// 5. Full send flow with 0.05 BNB
await tap(f, mockSend) // balance -> send
scrollDown(f) // 0.05
await tap(f, mockSend) // send -> confirm
out = renderFlow(f)
check('tap send -> confirm', f.screen === 'confirm', f.screen)
check('confirm shows 0.0500 + fee', has(out, '0.0500 BNB') && has(out, '0.0001 BNB'))

// 6. Cancel from confirm (scroll up) -> send, amount kept
scrollUp(f)
check('cancel confirm -> send', f.screen === 'send', f.screen)
check('amount kept after cancel', has(renderFlow(f), '0.0500 BNB'))

// 7. Confirm -> sending -> success; balance deducted amount + fee
await tap(f, mockSend) // send -> confirm
const sendPromise = tap(f, mockSend) // confirm -> sending (async)
check('confirm tap -> sending screen', f.screen === 'sending', f.screen)
// busy guard: a second tap while sending must be ignored (no double send)
let sendCount = 0
const countingSend = async (n: number) => {
  sendCount += 1
  return mockSend(n)
}
const f2 = createFlow()
f2.screen = 'confirm'
f2.amountIndex = 1 // 0.05 BNB, same as flow f
const p1 = tap(f2, countingSend)
const p2 = tap(f2, countingSend) // should no-op: busy
await Promise.all([p1, p2])
check('busy guard: only one send', sendCount === 1, `count=${sendCount}`)
await sendPromise
out = renderFlow(f)
check('after send -> success', f.screen === 'success', f.screen)
check('success shows tx hash', has(out, 'Tx: 0x'))
check('success shows amount', has(out, '0.0500 BNB sent'))
const expected = startBnb - 0.05 - MOCK_FEE_BNB - 0.05 - MOCK_FEE_BNB // f flow + f2 flow
check(
  'balance deducted (both flows)',
  Math.abs(wallet.bnb - expected) < 1e-9,
  `bnb=${wallet.bnb} expected=${expected}`,
)
check('success shows new balance', has(out, '1.1845'), out)

// 8. Tap success -> balance
await tap(f, mockSend)
check('tap success -> balance', f.screen === 'balance', f.screen)

console.log(failures === 0 ? '\nALL FLOW TESTS PASSED' : `\n${failures} FAILURES`)
process.exit(failures === 0 ? 0 : 1)
