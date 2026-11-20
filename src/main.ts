/**
 * GlassWallet — crypto wallet for Even Realities G2 smart glasses.
 *
 * Full flow happens ON the glasses; the phone stays in the pocket (it only
 * relays data in the background — the user never touches it).
 *
 * Interaction model (576x288 green canvas, one text container):
 *   - Temple tap (CLICK) ......... primary action: advance / confirm
 *   - R1 ring scroll ............. SCROLL_BOTTOM = next amount, SCROLL_TOP = back
 *   - Double-tap ................. exit (system confirmation, required)
 *   - Voice confirm .............. planned (ASR template); NOT in this scaffold
 *
 * Screens: balance -> send -> confirm -> sending -> success -> balance
 * In the simulator a mouse click fires CLICK, so the whole flow is
 * completable with clicks alone (amount defaults to the first preset).
 *
 * Screen logic lives in ./flow.ts (pure, unit-tested); this file is only
 * the thin Even Hub SDK wiring.
 */
import {
  waitForEvenAppBridge,
  TextContainerProperty,
  CreateStartUpPageContainer,
  TextContainerUpgrade,
  OsEventTypeList,
  EventSourceType,
} from '@evenrealities/even_hub_sdk'
import { createFlow, renderFlow, scrollDown, scrollUp, tap } from './flow.ts'
import { mockSend, refreshBnbPrice, wallet } from './wallet.ts'

const flow = createFlow()
const bridge = await waitForEvenAppBridge()

async function show(): Promise<void> {
  await bridge.textContainerUpgrade(
    new TextContainerUpgrade({
      containerID: 1,
      containerName: 'main',
      content: renderFlow(flow),
    }),
  )
}

const mainText = new TextContainerProperty({
  xPosition: 0,
  yPosition: 0,
  width: 576,
  height: 288,
  borderWidth: 0,
  borderColor: 5,
  paddingLength: 4,
  containerID: 1,
  containerName: 'main',
  content: renderFlow(flow),
  isEventCapture: 1,
})

const result = await bridge.createStartUpPageContainer(
  new CreateStartUpPageContainer({
    containerTotalNum: 1,
    textObject: [mainText],
  }),
)
console.log('GlassWallet page created:', result === 0 ? 'success' : `failed (${result})`)

// Read-only price refresh (falls back to mock). Never blocks the UI.
refreshBnbPrice()
  .then((price) => {
    wallet.bnbUsd = price
    if (flow.screen === 'balance') void show()
  })
  .catch(() => undefined)

// Poll the shared notification feed written by the Telegram bot stub
// (bot/bot.mjs -> public/notifications.json). Dev/simulator plumbing only:
// on hardware the phone app relays Telegram messages to the glasses.
async function pollNotifications(): Promise<void> {
  try {
    const res = await fetch('./notifications.json', { cache: 'no-store' })
    if (!res.ok) return
    const json = (await res.json()) as { text?: string }
    if (typeof json.text === 'string' && json.text && json.text !== flow.latestNotif) {
      flow.latestNotif = json.text
      if (flow.screen === 'balance') await show()
    }
  } catch {
    // Offline / file missing: keep the last notification. Never crash.
  }
}
setInterval(() => void pollNotifications(), 15000)
void pollNotifications()

// Reads the event type out of one envelope (same normalization as the
// minimal template: CLICK_EVENT is 0, protobuf omits zero-value fields, so
// a single tap can arrive as `eventType: undefined`).
function eventTypeOf(envelope?: { eventType?: OsEventTypeList }): OsEventTypeList | null {
  if (!envelope) return null
  return envelope.eventType ?? OsEventTypeList.CLICK_EVENT
}

async function onTap(source?: EventSourceType): Promise<void> {
  const from =
    source === EventSourceType.TOUCH_EVENT_FROM_RING
      ? 'R1 ring'
      : source === EventSourceType.TOUCH_EVENT_FROM_GLASSES_L
        ? 'temple kiri'
        : 'temple kanan'
  console.log(`Tap (${from}) on ${flow.screen}`)
  // Render the intermediate screen (e.g. 'sending' while the send runs)
  // before awaiting, otherwise the user never sees it: tap() only returns
  // after mockSend resolves, by which time the screen is already 'success'.
  const p = tap(flow, mockSend)
  await show()
  await p
  await show()
}

async function onScrollTop(): Promise<void> {
  scrollUp(flow)
  await show()
}

async function onScrollBottom(): Promise<void> {
  scrollDown(flow)
  await show()
}

const unsubscribe = bridge.onEvenHubEvent((event) => {
  const sysType = eventTypeOf(event.sysEvent)
  const textType = eventTypeOf(event.textEvent)

  // Double-tap exits everywhere (root page must use mode 1).
  if (
    sysType === OsEventTypeList.DOUBLE_CLICK_EVENT ||
    textType === OsEventTypeList.DOUBLE_CLICK_EVENT
  ) {
    bridge.shutDownPageContainer(1)
    return
  }

  if (
    sysType === OsEventTypeList.SCROLL_TOP_EVENT ||
    textType === OsEventTypeList.SCROLL_TOP_EVENT
  ) {
    void onScrollTop()
    return
  }

  if (
    sysType === OsEventTypeList.SCROLL_BOTTOM_EVENT ||
    textType === OsEventTypeList.SCROLL_BOTTOM_EVENT
  ) {
    void onScrollBottom()
    return
  }

  if (sysType === OsEventTypeList.CLICK_EVENT || textType === OsEventTypeList.CLICK_EVENT) {
    void onTap(event.sysEvent?.eventSource)
    return
  }

  if (
    sysType === OsEventTypeList.SYSTEM_EXIT_EVENT ||
    sysType === OsEventTypeList.ABNORMAL_EXIT_EVENT
  ) {
    unsubscribe()
  }
})
