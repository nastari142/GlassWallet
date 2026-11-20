// Bridge tap test — drives the REAL main.ts event wiring with synthetic
// Even Hub events, the way the simulator would deliver them.
//
// The simulator's own Click/Down buttons do not work in this headless VM
// (proven with the official minimal template too), so this harness replaces
// the SDK with test/bridge-mock.mjs and feeds the exact envelopes a real
// tap / ring scroll / double-tap produces.
//
// Usage:
//   <esbuild> src/main.ts --bundle --format=esm \
//     --outfile=/tmp/bridge-bundle.mjs \
//     --alias:@evenrealities/even_hub_sdk=$PWD/test/bridge-mock.mjs
//   node test/bridge-test.mjs /tmp/bridge-bundle.mjs
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const bundlePath = process.argv[2]
if (!bundlePath) {
  console.error('usage: node test/bridge-test.mjs <bundle-path>')
  process.exit(2)
}

await import(bundlePath)
const mock = globalThis.__gwBridgeMock
if (!mock) {
  console.error('FAIL: bundle did not register __gwBridgeMock')
  process.exit(2)
}
const { calls, emit } = mock
const E = mock.OsEventTypeList

// Wait for startup to finish (createStartUpPageContainer + first render).
for (let i = 0; i < 100 && !calls.startup; i++) await sleep(50)
if (!calls.startup) {
  console.error('FAIL: startup page was never created')
  process.exit(1)
}

const last = () => calls.upgrades[calls.upgrades.length - 1] ?? ''
let pass = 0
let fail = 0
function check(substr, label) {
  if (last().includes(substr)) {
    console.log(`PASS: ${label}`)
    pass++
  } else {
    console.log(`FAIL: ${label} — last screen was:\n${last()}`)
    fail++
  }
}

// The initial screen is carried inside the startup-page request itself,
// not through textContainerUpgrade, so assert on that.
const startupContent = calls.startup?.textObject?.[0]?.content ?? ''
if (startupContent.includes('Saldo BNB')) {
  console.log('PASS: 1. startup renders balance screen')
  pass++
} else {
  console.log(`FAIL: 1. startup renders balance screen — startup content was:\n${startupContent}`)
  fail++
}
await sleep(100)

// Tap with eventType OMITTED (protobuf drops zero-value fields) — must still
// count as CLICK_EVENT, per main.ts eventTypeOf().
emit({ sysEvent: {} })
await sleep(150)
check('KIRIM BNB', '2. tap (no eventType) advances balance -> send')

// Scroll down twice via textEvent (not sysEvent) -> amount 0.01 -> 0.05 -> 0.1
emit({ textEvent: { eventType: E.SCROLL_BOTTOM_EVENT } })
await sleep(100)
emit({ textEvent: { eventType: E.SCROLL_BOTTOM_EVENT } })
await sleep(100)
check('0.1000 BNB', '3. ring scroll down x2 cycles amount to 0.1 BNB')

emit({ sysEvent: { eventType: E.CLICK_EVENT } })
await sleep(150)
check('KONFIRMASI', '4. tap advances send -> confirm')

emit({ sysEvent: { eventType: E.SCROLL_TOP_EVENT } })
await sleep(150)
check('KIRIM BNB', '5. ring scroll up cancels confirm -> send')

emit({ sysEvent: { eventType: E.CLICK_EVENT } })
await sleep(150)
check('KONFIRMASI', '6. tap advances send -> confirm again')

// Confirm tap: shows sending, then success after mockSend (~900ms).
// A second tap DURING sending must be ignored (busy guard).
emit({ sysEvent: { eventType: E.CLICK_EVENT } })
await sleep(150)
check('Mengirim...', '7. tap on confirm shows sending screen')
emit({ sysEvent: { eventType: E.CLICK_EVENT } })
await sleep(1500)
check('BERHASIL', '8. sending completes to success (busy-guard tap ignored)')

emit({ sysEvent: { eventType: E.CLICK_EVENT } })
await sleep(150)
check('Saldo BNB', '9. tap on success returns to balance')

emit({ sysEvent: { eventType: E.DOUBLE_CLICK_EVENT } })
await sleep(150)
if (calls.shutdowns.includes(1)) {
  console.log('PASS: 10. double-tap calls shutDownPageContainer(1)')
  pass++
} else {
  console.log(`FAIL: 10. double-tap did not shut down (shutdowns=${JSON.stringify(calls.shutdowns)})`)
  fail++
}

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
