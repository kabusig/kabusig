"""禁止ワードテスト(指示書 §1-3)。

投資助言に該当しうる表現が UI 文言・通知テンプレート・シグナル定義に
含まれていないことを全ソースを走査して確認する。
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent

FORBIDDEN = [
    "買い時", "売り時", "おすすめ", "推奨", "注目銘柄",
    "買うべき", "売るべき", "買いましょう", "売りましょう",
    "買いシグナル", "売りシグナル", "上がりそう", "下がりそう",
    "儲か", "必勝", "爆上げ", "急騰確実",
]

TARGET_SUFFIXES = {".py", ".ts", ".tsx", ".html", ".sql", ".yml", ".yaml", ".md"}
EXCLUDE_PARTS = {"node_modules", ".next", ".venv", "tests", ".git", "data"}
# 開発指示書自体は NG 表現の説明を含むため除外
EXCLUDE_NAMES = {"株式指標通知サービス_開発指示書.md"}


def iter_targets():
    for p in ROOT.rglob("*"):
        if not p.is_file() or p.suffix not in TARGET_SUFFIXES:
            continue
        if set(p.parts) & EXCLUDE_PARTS or p.name in EXCLUDE_NAMES:
            continue
        yield p


def test_no_forbidden_words_in_sources():
    violations = []
    for p in iter_targets():
        try:
            text = p.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        for word in FORBIDDEN:
            if word in text:
                for i, line in enumerate(text.splitlines(), 1):
                    if word in line:
                        violations.append(f"{p.relative_to(ROOT)}:{i}: '{word}'")
    assert not violations, "禁止ワード検出:\n" + "\n".join(violations)


def test_signal_definitions_are_neutral():
    """シグナル名・説明文に方向性を示唆する語が含まれない。"""
    import sys
    sys.path.insert(0, str(ROOT / "batch"))
    from signals import ALL_SIGNALS

    for s in ALL_SIGNALS:
        text = s.name + s.description + s.origin
        for word in FORBIDDEN:
            assert word not in text, f"{s.id}: '{word}' が含まれています"


def test_disclaimer_is_intact():
    import sys
    sys.path.insert(0, str(ROOT / "batch"))
    import config
    assert "投資勧誘・投資助言ではありません" in config.DISCLAIMER
    assert "投資判断はご自身の責任" in config.DISCLAIMER
