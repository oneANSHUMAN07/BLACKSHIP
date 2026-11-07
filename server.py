import os
from flask_cors import CORS
import json
from pathlib import Path

from flask import Flask, request, jsonify
from dotenv import load_dotenv
from adaption import Adaption


# Load environment variables
BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env.local")


app = Flask(__name__)
CORS(app)

# Adaption API configuration
api_key = os.getenv("ADAPTION_API_KEY")

if not api_key:
    raise RuntimeError("ADAPTION_API_KEY is missing")

client = Adaption(api_key=api_key)


@app.get("/api/health")
def health():
    return jsonify({
        "status": "ok",
        "adaption": "configured"
    })


@app.post("/api/audit")
def audit():
    data = request.get_json() or {}
    content = data.get("content", "").strip()

    if not content:
        return jsonify({
            "error": "Content is required"
        }), 400

    prompt = f"""
You are BLACKSHIP, a brand governance auditor.

Analyze the following content for:

1. Unsupported or exaggerated claims
2. Restricted or risky language
3. Tone mismatch
4. Brand-governance concerns

Content:
{content}

Return ONLY valid JSON in this exact structure:

{{
  "passed": true,
  "findings": [
    {{
      "category": "Unsupported Claim",
      "severity": "high",
      "issue": "Short explanation",
      "recommendation": "Specific recommendation"
    }}
  ],
  "summary": "Short overall explanation"
}}

Rules:
- Set passed to false if meaningful brand-governance issues are found.
- Flag unsupported absolute claims such as "best", "number one",
  "guaranteed", or similar claims when evidence is not provided.
- Flag restricted, risky, misleading, or overly aggressive language.
- Flag clear tone mismatches.
- Do not invent facts about the brand.
- If there are no meaningful issues, return:
  findings: []
  passed: true
"""

    try:
        response = client.responses.create(
            model="qwen3.5-397b",
            input=prompt,
        )

        # Adaption SDK returns a dictionary
        response_data = (
            response.to_dict()
            if hasattr(response, "to_dict")
            else response
        )

        # Extract generated text safely from the response dictionary
        ai_text = ""

        def extract_text(value):
            if isinstance(value, str):
                return value

            if isinstance(value, dict):
                # Most likely text fields
                for key in ("text", "output_text", "content"):
                    if key in value:
                        result = extract_text(value[key])
                        if result:
                            return result

                # Search nested response fields
                for nested_value in value.values():
                    result = extract_text(nested_value)
                    if result:
                        return result

            elif isinstance(value, list):
                for item in value:
                    result = extract_text(item)
                    if result:
                        return result

            return ""

        ai_text = extract_text(response_data).strip()

        if not ai_text:
            return jsonify({
                "success": False,
                "error": "Adaption returned an empty response",
                "raw_response": response_data
            }), 502

        # Parse AI JSON
        try:
            ai_result = json.loads(ai_text)
        except json.JSONDecodeError:
            ai_result = {
                "passed": False,
                "findings": [],
                "summary": "Adaption returned non-JSON output.",
                "raw_response": ai_text
            }

        return jsonify({
            "success": True,
            "content": content,
            "ai_result": ai_result
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=8000,
        debug=True
    )
