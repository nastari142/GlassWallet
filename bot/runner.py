#!/usr/bin/env python3
"""GlassWallet Telegram bot runner (demo, no real funds).

Polls the GlassWallet bot (@glasswalletbot) with getUpdates and answers
/start, /saldo, /kirim, /harga — mirroring bot/bot.mjs, whose Node code
cannot read the vault-stored token. The Bot API calls go through
custom.telegram-bot-glasswallet/bin/telegram_api.py, which uses the stored
credential via a surrogate; the token itself is never in this file, in
arguments, in env vars, or in logs.

Every message the bot sends is also written to
~/workspace/even-realities-glasswallet/public/notifications.json (latest
only), which the glasses app polls in dev/simulator.

Usage:
  nohup python3 ~/workspace/even-realities-glasswallet/bot/runner.py \
    >> ~/workspace/even-realities-glasswallet/bot/runner.log 2>&1 &
"""
import json
import os
import sys
import time
import urllib.request

sys.path.insert(
    0, "/home/hatch/workspace/custom-connectors/custom.telegram-bot-glasswallet/bin"
)
from telegram_api import get_updates, send_animation, send_message  # noqa: E402

NOTIF_PATH = "/home/hatch/workspace/even-realities-glasswallet/public/notifications.json"
ANIMATION_PATH = "/home/hatch/workspace/even-realities-glasswallet/bot/start-animation.mp4"

DEMO = {
    "address_short": "0x4080\u2026c1A1",
    "bnb": 1.2847,
    "usdt": 128.4,
    "bnb_usd_fallback": 612.3,
}
MOCK_FEE_BNB = 0.0001
_tx_counter = 0


def fmt_usd(n):
    return f"${n:,.2f}"


def fmt_bnb(n):
    return f"{n:.4f}"


def mock_tx_hash():
    global _tx_counter
    _tx_counter += 1
    stamp = format(int(time.time() * 1000), "x")
    count = format(_tx_counter, "04x")
    return ("0x" + (stamp + count + "glasswalletdemo").ljust(64, "0"))[:66]


def fetch_bnb_price():
    try:
        req = urllib.request.Request(
            "https://api.coingecko.com/api/v3/simple/price"
            "?ids=binancecoin&vs_currencies=usd",
            headers={"User-Agent": "GlassWallet-demo/1.0"},
        )
        with urllib.request.urlopen(req, timeout=5) as r:
            data = json.loads(r.read().decode("utf-8"))
        price = data.get("binancecoin", {}).get("usd")
        if isinstance(price, (int, float)) and price > 0:
            return float(price)
    except Exception as e:  # noqa: BLE001 - network is best-effort, mock fallback
        print(f"[price] CoinGecko failed, mock fallback: {e}", flush=True)
    return DEMO["bnb_usd_fallback"]


def push_to_glasses(text):
    try:
        with open(NOTIF_PATH, "w", encoding="utf-8") as f:
            json.dump({"text": text, "at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}, f, indent=2)
            f.write("\n")
    except Exception as e:  # noqa: BLE001 - glasses feed is best-effort
        print(f"[notify] could not write notifications.json: {e}", flush=True)


def notify(text):
    push_to_glasses(text)
    print(f"[notify] glasses feed updated: {text}", flush=True)


def handle_command(chat_id, text):
    parts = text.strip().split()
    cmd = parts[0]
    args = parts[1:]
    if cmd == "/start":
        try:
            send_animation(chat_id, ANIMATION_PATH)
        except Exception as e:  # noqa: BLE001 - animation is best-effort, text still goes out
            print(f"[start] animation failed (text still sent): {e}", flush=True)
        send_message(
            chat_id,
            "\U0001f453 GlassWallet (demo)\n\n"
            "Crypto wallet on Even G2 glasses, with this bot as its companion.\n\n"
            "/saldo \u2014 check demo balance\n"
            "/kirim <amount_BNB> [address] \u2014 mock send (no real funds)\n"
            "/harga \u2014 BNB price\n\n"
            "Confirm transactions on the glasses: tap the temple / spin the R1 ring. The phone stays in your pocket.",
        )
    elif cmd == "/saldo":
        price = fetch_bnb_price()
        send_message(
            chat_id,
            f"\U0001f4b0 Demo balance ({DEMO['address_short']})\n"
            f"BNB : {fmt_bnb(DEMO['bnb'])}  ({fmt_usd(DEMO['bnb'] * price)})\n"
            f"USDT: {DEMO['usdt']:.2f}\n"
            f"BNB: {fmt_usd(price)}",
        )
    elif cmd == "/kirim":
        try:
            amount = float(args[0]) if args else float("nan")
        except (ValueError, IndexError):
            amount = float("nan")
        to = args[1] if len(args) > 1 else "0x1234567890abcdef1234567890abcdef12345678"
        if not (amount == amount and amount > 0):
            send_message(chat_id, "Usage: /kirim <amount_BNB> [address]\nExample: /kirim 0.05")
            return
        if amount + MOCK_FEE_BNB > DEMO["bnb"]:
            send_message(chat_id, f"Demo balance too low (balance {fmt_bnb(DEMO['bnb'])} BNB).")
            return
        DEMO["bnb"] = max(0.0, DEMO["bnb"] - amount - MOCK_FEE_BNB)
        h = mock_tx_hash()
        short_to = f"{to[:6]}\u2026{to[-4:]}"
        notify(f"\u2705 Sent {fmt_bnb(amount)} BNB to {short_to}\nTx: {h[:10]}\u2026 (mock)")
        send_message(
            chat_id,
            f"\u2705 Mock sent {fmt_bnb(amount)} BNB to {short_to}\n"
            f"Tx: {h[:10]}\u2026{h[-4:]} (mock)\n"
            f"New balance: {fmt_bnb(DEMO['bnb'])} BNB\n"
            f"The same notification was sent to the glasses.",
        )
    elif cmd == "/harga":
        price = fetch_bnb_price()
        send_message(chat_id, f"BNB: {fmt_usd(price)} (demo)")
    else:
        send_message(chat_id, "Unknown command. Try /start, /saldo, /kirim, /harga.")


def main():
    print("GlassWallet bot runner started (demo, no real funds).", flush=True)
    print("Commands: /start /saldo /kirim /harga", flush=True)
    offset = 0
    while True:
        try:
            res = get_updates(offset, timeout=25)
            for update in res.get("result", []):
                offset = update["update_id"] + 1
                msg = update.get("message") or {}
                text = msg.get("text") or ""
                chat = msg.get("chat") or {}
                if text.startswith("/"):
                    print(f"[cmd] {chat.get('id')}: {text}", flush=True)
                    try:
                        handle_command(chat["id"], text)
                    except Exception as e:  # noqa: BLE001 - keep polling
                        print(f"[cmd] failed: {e}", flush=True)
        except Exception as e:  # noqa: BLE001 - poll loop must survive
            print(f"[poll] error (retrying): {e}", flush=True)
            time.sleep(3)


if __name__ == "__main__":
    main()
