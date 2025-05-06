import json
from collections import Counter
from pathlib import Path

uuids = []
for path in Path("../data/fude_polygon_2024").rglob("*.json"):
    print(path)
    with open(path) as f:
        data = json.load(f)
        for feature in data["features"]:
            uuids.append(feature["properties"]["polygon_uuid"])

dupes = [uuid for uuid, count in Counter(uuids).items() if count > 1]
print(f"重複しているUUID数: {len(dupes)}")

# c438b64c3c2a413c844dc686da3ad1e8
