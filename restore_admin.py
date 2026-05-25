import json
import os

log_path = r"C:\Users\user\.gemini\antigravity\brain\1f7266ad-9d9e-437e-ab76-d317f8bb5ed0\.system_generated\logs\transcript.jsonl"
with open(log_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

# Read index 127 which contains our latest robust Gemini version of admin/index.html with all fixes
js = json.loads(lines[127])
code_escaped = js['tool_calls'][0]['args']['CodeContent']

if code_escaped.startswith('"') and code_escaped.endswith('"'):
    code_escaped = code_escaped[1:-1]

html_content = code_escaped.replace('\\n', '\n').replace('\\t', '\t').replace('\\"', '"').replace('\\\\', '\\')
html_content = html_content.strip('"')

# Ensure the admin folder exists
os.makedirs(r"c:\Users\user\.gemini\antigravity\scratch\algoedu\admin", exist_ok=True)

out_path = r"c:\Users\user\.gemini\antigravity\scratch\algoedu\admin\index.html"
with open(out_path, "w", encoding="utf-8") as f:
    f.write(html_content)

print("ADMIN RESTORED PERFECTLY!")
