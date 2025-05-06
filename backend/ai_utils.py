import openai
import os
import json
from dotenv import load_dotenv
from datetime import date, timedelta
import re

load_dotenv()

# OpenRouter設定
openai.api_key = os.getenv("OPENROUTER_API_KEY")
openai.base_url = "https://openrouter.ai/api/v1"

client = openai.OpenAI(api_key=openai.api_key, base_url=openai.base_url)

def extract_json(text):
    """テキスト中の最初のJSONオブジェクトを抽出する"""
    match = re.search(r"\{[\s\S]*?\}", text)
    if match:
        return match.group(0)
    raise ValueError("JSONブロックが見つかりませんでした")

def parse_natural_task(message: str) -> dict:
    prompt = f"""
以下の自然言語の内容を日本語で処理してください。
あなたは日本人ユーザー向けのToDoアプリのAIです。

与えられた文章から以下のJSON形式を出力してください：

- タイトル（日本語）
- 締切日（YYYY-MM-DD形式、「今日」「明日」などの表現は自動で日付に変換）
- 優先度（高・中・低）

入力文:
{message}

出力形式（JSON）:
{{
  "title": "〇〇",
  "deadline": "2025-05-07",
  "priority": "高"
}}
"""

    try:
        print("📤 Prompt送信中...")
        response = client.chat.completions.create(
            model="mistralai/mistral-7b-instruct",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4,
        )
        raw_result = response.choices[0].message.content
        print("💬 OpenRouter返答内容:\n", raw_result)

        json_text = extract_json(raw_result)
        parsed = json.loads(json_text)

        # 締切補完
        deadline = parsed.get("deadline", "")
        if "今日" in deadline or "YYYY-MM-DD" in deadline:
            parsed["deadline"] = str(date.today())
        elif "明日" in deadline or "1日後" in deadline:
            parsed["deadline"] = str(date.today() + timedelta(days=1))
        elif "2日後" in deadline:
            parsed["deadline"] = str(date.today() + timedelta(days=2))

        return parsed

    except Exception as e:
        import traceback
        print("🛑 OpenRouter API Error:\n", traceback.format_exc())
        raise Exception("parse_natural_task failed")


def suggest_schedule(tasks: list) -> list:
    task_list_str = json.dumps(tasks, ensure_ascii=False, indent=2)
    prompt = f"""
あなたは日本人ユーザー向けのToDo管理AIです。
以下はToDoタスクの一覧です。優先度・締切日・状態を考慮して、
「本日中にやるべきタスクを最大3件」日本語で選んでください。

未着手または作業中のみ対象とします。
重要性や緊急性、作業ボリュームを加味してください。

出力形式（JSON）:
[
  {{
    "title": "〜",
    "deadline": "〜",
    "priority": "〜",
    "reason": "〜"
  }}
]

タスク一覧:
{task_list_str}
"""

    try:
        response = client.chat.completions.create(
            model="mistralai/mistral-7b-instruct",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4,
        )
        result = response.choices[0].message.content
        print("📅 スケジュール提案出力:\n", result)
        return json.loads(result)

    except Exception as e:
        import traceback
        print("🛑 Schedule API Error:\n", traceback.format_exc())
        raise Exception("suggest_schedule failed")
