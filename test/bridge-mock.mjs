// Mock of @evenrealities/even_hub_sdk for the bridge tap test.
//
// main.ts is bundled with esbuild with this file aliased in place of the real
// SDK, so the bundle carries its own copy of this module. State is therefore
// shared with the driver through globalThis, not through imports.
//
// Enum values copied from the real SDK (node_modules/@evenrealities/
// even_hub_sdk/dist/index.d.ts): CLICK=0, SCROLL_TOP=1, SCROLL_BOTTOM=2,
// DOUBLE_CLICK=3, SYSTEM_EXIT=7; RING source=2, GLASSES_L=3.
export const OsEventTypeList = {
  CLICK_EVENT: 0,
  SCROLL_TOP_EVENT: 1,
  SCROLL_BOTTOM_EVENT: 2,
  DOUBLE_CLICK_EVENT: 3,
  FOREGROUND_ENTER_EVENT: 4,
  FOREGROUND_EXIT_EVENT: 5,
  ABNORMAL_EXIT_EVENT: 6,
  SYSTEM_EXIT_EVENT: 7,
  IMU_DATA_REPORT: 8,
}

export const EventSourceType = {
  TOUCH_EVENT_FORM_DUMMY_NULL: 0,
  TOUCH_EVENT_FROM_GLASSES_R: 1,
  TOUCH_EVENT_FROM_RING: 2,
  TOUCH_EVENT_FROM_GLASSES_L: 3,
}

export class TextContainerProperty {
  constructor(args) {
    Object.assign(this, args)
  }
}
export class CreateStartUpPageContainer {
  constructor(args) {
    Object.assign(this, args)
  }
}
export class TextContainerUpgrade {
  constructor(args) {
    Object.assign(this, args)
  }
}

export const calls = { startup: null, upgrades: [], shutdowns: [] }
let handler = null

export const bridge = {
  createStartUpPageContainer: async (req) => {
    calls.startup = req
    return 0
  },
  textContainerUpgrade: async (up) => {
    calls.upgrades.push(up.content)
    return 0
  },
  onEvenHubEvent: (cb) => {
    handler = cb
    return () => {
      handler = null
    }
  },
  shutDownPageContainer: async (id) => {
    calls.shutdowns.push(id)
    return true
  },
}

export function emit(event) {
  if (!handler) throw new Error('no event handler registered yet')
  handler(event)
}

export async function waitForEvenAppBridge() {
  return bridge
}

// Shared with the test driver (the bundle carries its own copy of this module).
globalThis.__gwBridgeMock = { calls, bridge, emit, OsEventTypeList, EventSourceType }
