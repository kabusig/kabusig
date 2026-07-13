"""全データ再構築パイプライン(J-Quants切り替え・初期投入用)。

銘柄マスタ→株価(J-Quants全履歴)→指標→シグナル→結果統計→Supabase同期 を
一気通貫で実行する。株価ソースが変わると指標・シグナルも変わるため、
signal_events / signal_stats は一旦クリアして再検知する。

usage: python refresh_all.py [--no-push]
"""
from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
PY = sys.executable


def run(*args: str):
    print(f"\n=== {' '.join(args)} ===", flush=True)
    subprocess.run([PY, str(HERE / args[0]), *args[1:]], check=True)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--no-push", action="store_true",
                        help="Supabase同期をスキップ(ローカルのみ)")
    args = parser.parse_args()

    run("fetch_stocklist.py")
    run("fetch_prices_jquants.py", "--bulk")
    run("calc_indicators.py")

    # 株価が変わったのでシグナルは作り直す
    print("\n=== clear signal_events / signal_stats ===", flush=True)
    from storage import get_storage
    st = get_storage()
    st.conn.execute("delete from signal_events")
    st.conn.execute("delete from signal_stats")
    st.conn.execute("delete from notification_logs")
    st.conn.commit()

    run("detect_signals.py", "--backfill")
    run("calc_signal_results.py")

    if not args.no_push:
        run("push_supabase.py", "--full")

    print("\nrefresh_all done", flush=True)


if __name__ == "__main__":
    main()
