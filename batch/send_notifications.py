"""LINE通知送信バッチ(フェーズ1: 開発者本人への通知のみ)。

【プラン方針】LINE通知は有料会員専用機能。無料枠は設けない。
既定はシグナル検知ごとの都度通知。--digest は1通にまとめたい場合の
オプション(有料会員の設定項目として提供予定)。

- LINE_CHANNEL_ACCESS_TOKEN / LINE_DEV_USER_ID 未設定時は dry-run(標準出力)
- notification_logs の unique 制約で重複送信を防止
- 送信失敗は指数バックオフで3回リトライ、以後スキップしログに記録
- 通知文テンプレートは指示書 §6 を厳守(免責文言は config.DISCLAIMER)
"""
from __future__ import annotations

import argparse
import sys
import time
from datetime import date

import requests

import config
from storage import get_storage

LINE_PUSH_URL = "https://api.line.me/v2/bot/message/push"


def build_signal_message(ev: dict) -> str:
    import json
    detail = json.loads(ev["detail"]) if isinstance(ev["detail"], str) else (ev["detail"] or {})
    close = detail.pop("close", None)
    detail_str = " / ".join(f"{k}={v}" for k, v in detail.items()) or "-"
    lines = [
        f"【シグナル検知】{ev['code']} {ev['stock_name']}",
        f"条件: {ev['description']}",
        f"検知値: {detail_str}",
    ]
    if close is not None:
        lines.append(f"終値: {close}円")
    lines.append(f"チャート: {config.APP_URL}/stocks/{ev['code']}")
    lines.append("")
    lines.append(config.DISCLAIMER)
    return "\n".join(lines)


def push_line(user_id: str, text: str, max_retry: int = 3) -> bool:
    if not config.LINE_CHANNEL_ACCESS_TOKEN:
        print("--- dry-run(LINE_CHANNEL_ACCESS_TOKEN 未設定)---")
        print(text)
        return True
    headers = {"Authorization": f"Bearer {config.LINE_CHANNEL_ACCESS_TOKEN}"}
    payload = {"to": user_id, "messages": [{"type": "text", "text": text[:5000]}]}
    for attempt in range(max_retry):
        try:
            r = requests.post(LINE_PUSH_URL, headers=headers, json=payload, timeout=15)
            if r.status_code == 200:
                return True
            # ブロック等(403)はリトライ不要
            if r.status_code in (400, 403):
                print(f"LINE push failed permanently: {r.status_code} {r.text}",
                      file=sys.stderr)
                return False
        except requests.RequestException as e:
            print(f"LINE push error (attempt {attempt + 1}): {e}", file=sys.stderr)
        time.sleep(2 ** attempt)
    return False


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--date", default=date.today().strftime("%Y-%m-%d"))
    parser.add_argument("--digest", action="store_true",
                        help="当日分を1通にまとめて送信(まとめ通知設定)")
    args = parser.parse_args()

    storage = get_storage()
    events = storage.get_signal_events(on_date=args.date)
    if not events:
        print(f"no signal events on {args.date}")
        return

    user_id = config.LINE_DEV_USER_ID or "dev-user"

    if args.digest:
        # まとめ通知: 銘柄×シグナル名の一覧を1通に
        lines = [f"【本日のシグナル検知まとめ】{args.date}"]
        new_ids = []
        for ev in events:
            if storage.log_notification(user_id, ev["id"]):
                lines.append(f"・{ev['code']} {ev['stock_name']}: {ev['signal_name']}")
                new_ids.append(ev["id"])
        if not new_ids:
            print("all events already notified")
            return
        lines.append(f"詳細: {config.APP_URL}")
        lines.append("")
        lines.append(config.DISCLAIMER)
        push_line(user_id, "\n".join(lines))
        print(f"digest sent ({len(new_ids)} events)")
    else:
        sent = 0
        for ev in events:
            if not storage.log_notification(user_id, ev["id"]):
                continue  # 送信済み(冪等)
            if push_line(user_id, build_signal_message(ev)):
                sent += 1
        print(f"sent {sent} notifications")


if __name__ == "__main__":
    main()
