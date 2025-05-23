import requests
import time
from pathlib import Path
from dotenv import load_dotenv
import os

load_dotenv(dotenv_path=Path(__file__).resolve().parents[1] / ".env")
PLANET_API_KEY = os.getenv('PLANET_API_KEY') # 必ず環境変数から読み込むべし

def poll_for_success(order_url, auth, num_loops=360): # num_loops * time.sleep(x) 秒で終わる。
    count = 0
    while(count < num_loops):
        count += 1
        r = requests.get(order_url, auth=session.auth)
        response = r.json()
        state = response['state']
        print(state + '[' + str(count) + ']')
        end_states = ['success', 'failed', 'partial']
        if state in end_states:
            break
        time.sleep(10)

order_url = "https://api.planet.com/compute/ops/orders/v2/af18fc85-a4fe-44c9-95c5-46e547f19987"

session = requests.Session()
session.auth = (PLANET_API_KEY, "")

poll_for_success(order_url, auth=session.auth)
