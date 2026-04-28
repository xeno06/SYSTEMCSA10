"""Quick test for the /mine endpoint."""
import urllib.request
import json

boundary = "----TestBoundary123"

with open("mock_apriori.csv", "rb") as f:
    file_content = f.read()

parts = []
# file
parts.append(
    "--" + boundary + "\r\n"
    'Content-Disposition: form-data; name="file"; filename="mock_apriori.csv"\r\n'
    "Content-Type: text/csv\r\n\r\n"
)
parts.append(file_content)
parts.append("\r\n")

# fields
for name, value in [("algorithm", "apriori"), ("min_support", "0.01"), ("min_confidence", "0.1"), ("business_type", "pet food shop")]:
    parts.append(
        "--" + boundary + "\r\n"
        f'Content-Disposition: form-data; name="{name}"\r\n\r\n'
        f"{value}\r\n"
    )

parts.append("--" + boundary + "--\r\n")

body = b""
for p in parts:
    body += p.encode("utf-8") if isinstance(p, str) else p

req = urllib.request.Request(
    "http://localhost:8000/mine",
    data=body,
    headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
)

try:
    resp = urllib.request.urlopen(req, timeout=30)
    result = json.loads(resp.read())
    print("STATUS: 200")
    print("KEYS:", list(result.keys()))
    print("topPairs count:", len(result.get("topPairs", [])))
    print("topProducts count:", len(result.get("topProducts", [])))
    if result.get("topPairs"):
        p = result["topPairs"][0]
        print("First pair:", p.get("pair"), "count:", p.get("count"), "conf:", p.get("conf"))
    if result.get("meta"):
        print("Meta:", result["meta"])
except urllib.error.HTTPError as e:
    print("HTTP ERROR:", e.code)
    print("BODY:", e.read().decode())
except Exception as e:
    print("ERROR:", type(e).__name__, e)
