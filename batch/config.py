"""バッチ共通設定。

環境変数で挙動を切り替える。ローカル開発は既定値(SQLite)のまま動く。
"""
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"
DATA_DIR.mkdir(exist_ok=True)

# .env の読み込み(Webと同じ apps/web/.env.local を優先、なければ root/.env)。
# CI や本番では環境変数が直接設定されるため、ファイルが無くても動く。
try:
    from dotenv import load_dotenv

    for _envf in (ROOT / "apps" / "web" / ".env.local", ROOT / ".env"):
        if _envf.exists():
            load_dotenv(_envf)
except ImportError:
    pass

# 'sqlite'(ローカル開発・フェーズ1) | 'supabase'(公開運用・フェーズ2以降)
DATA_BACKEND = os.environ.get("DATA_BACKEND", "sqlite")
SQLITE_PATH = os.environ.get("SQLITE_PATH", str(DATA_DIR / "local.db"))

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

LINE_CHANNEL_ACCESS_TOKEN = os.environ.get("LINE_CHANNEL_ACCESS_TOKEN", "")
# フェーズ1: 自分の LINE userId をハードコード的に環境変数で渡す
LINE_DEV_USER_ID = os.environ.get("LINE_DEV_USER_ID", "")

APP_URL = os.environ.get("NEXT_PUBLIC_APP_URL", "http://localhost:3000")

# 通知の末尾に必ず付与する固定免責文言(変更禁止)
DISCLAIMER = (
    "※本通知は情報提供であり、投資勧誘・投資助言ではありません。"
    "投資判断はご自身の責任で行ってください。"
)

# J-Quants(フェーズ2、2024年以降のAPI v2)。
# v2は APIキー方式(x-api-key ヘッダー)。旧 refresh token 方式は廃止。
# 互換のため JQUANTS_REFRESH_TOKEN も APIキーとして受け付ける。
JQUANTS_API_KEY = os.environ.get("JQUANTS_API_KEY", "") or \
    os.environ.get("JQUANTS_REFRESH_TOKEN", "")
JQUANTS_REFRESH_TOKEN = JQUANTS_API_KEY  # 後方互換
JQUANTS_BASE = "https://api.jquants.com/v2"
JQUANTS_RATE_LIMIT_SEC = 0.2  # 有料プラン。行儀よく間隔を空ける
