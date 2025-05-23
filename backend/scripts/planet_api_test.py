import pathlib
from pathlib import Path
from dotenv import load_dotenv
import os
import requests
from requests.auth import HTTPBasicAuth
from datetime import datetime, timedelta, timezone
from multiprocessing.dummy import Pool as ThreadPool
from retrying import retry
import json
import time

load_dotenv(dotenv_path=Path(__file__).resolve().parents[1] / ".env")
PLANET_API_KEY = os.getenv('PLANET_API_KEY') # 必ず環境変数から読み込むべし

#################### Step 1: 衛星画像の検索ココカラ ####################
print('-' * 50)
print("1. 衛星画像の検索")

### 検索フィルターの定義 ###
print("・検索フィルターの定義")

MY_AOI = [
    [
        132.504076944,
        34.382259263
    ],
    [
        132.503900171,
        34.382438122
    ],
    [
        132.503964883,
        34.382470349
    ],
    [
        132.503994937,
        34.382454618
    ],
    [
        132.50400554,
        34.382453332
    ],
    [
        132.504035974,
        34.382435599
    ],
    [
        132.504046921,
        34.382442329
    ],
    [
        132.50405873,
        34.382441191
    ],
    [
        132.504150284,
        34.382407327
    ],
    [
        132.504182063,
        34.382395617
    ],
    [
        132.504203222,
        34.382381109
    ],
    [
        132.504218299,
        34.382361277
    ],
    [
        132.504225018,
        34.382336443
    ],
    [
        132.504223996,
        34.38227048
    ],
    [
        132.504076944,
        34.382259263
    ]
]

geo_json_geometry = {
    "type": "Polygon",
    "coordinates": [
        MY_AOI # ポリゴンは一つしか指定できないみたい．（複数指定して試験したら先頭のポリゴンしか見られない．）
    ]
}

# filter for items the overlap with our chosen geometry
geometry_filter = {
    "type": "GeometryFilter",
    "field_name": "geometry",
    "config": geo_json_geometry
}

# filter images acquired in a certain date range
JST = timezone(timedelta(hours=9))
now = datetime.now(JST)
date_range_filter = {
    "type": "DateRangeFilter",
    "field_name": "acquired",
    "config": {
        "gte": (now - timedelta(days = 6)).isoformat(), # ここはJST(+09:00)にしないと扱いにくい。
        "lte": now.isoformat()
    }
}

# filter any images which are more than 50% clouds
# cloud_cover_filter = {
#     "type": "RangeFilter",
#     "field_name": "cloud_cover",
#     "config": {
#         "lte": 0.9 # 全体の雲量が50%とかでもAOIは写ってたりするため。
#     }
# }

# create a filter that combines our geo and date filters
# could also use an "OrFilter"
redding_reservoir = {
    "type": "AndFilter",
    "config": [geometry_filter, date_range_filter] # , cloud_cover_filter]
}

### 検索のヒット件数のみを表示 ###
print("・検索のヒット件数のみを表示") # 一度に注文できるのは最大250枚まで？

# Stats API request object
stats_endpoint_request = {
    "interval": "year", # day, month, yearとか．result.textの区切り方が違うだけ？
    "item_types": ["PSScene"],
    "filter": redding_reservoir
}

# fire off the POST request
result = \
    requests.post(
        'https://api.planet.com/data/v1/stats',
        auth = HTTPBasicAuth(PLANET_API_KEY, ''),
        json = stats_endpoint_request
    )

print(result.text)

### 実際に検索を実行 ###
print("・実際に検索を実行")

# Search API request object
search_endpoint_request = {
  "item_types": ["PSScene"],
  "filter": redding_reservoir
}

result = \
  requests.post(
    'https://api.planet.com/data/v1/quick-search',
    auth = HTTPBasicAuth(PLANET_API_KEY, ''),
    json = search_endpoint_request
    )

# レスポンスをJSONとして解析
result_json = result.json()

# 成形して中身を全て表示（細かいメタデータも含んでるよ。）
# formatted_json = json.dumps(result_json, indent=2)
# print(formatted_json)

# features配列から各オブジェクトのidフィールドを抽出してテキストファイルに出力
path_ids = "PSScene_ids.txt"

with open(path_ids, mode='w') as f:
  for feature in result_json.get('features', []):
    f.write(feature.get('id') + '\n')

# 作成したテキストファイルを表示
with open(path_ids) as f:
  s = f.read()
  print(s)

# 検索結果のプレビュー画像を見れる。（API_KEYを末尾に付与しているから。）
for feature in result_json.get('features', []):
    thumbnail = feature.get('_links', {}).get('thumbnail')
    print(thumbnail + "?api_key=" + PLANET_API_KEY)

#################### Step 1: 衛星画像の検索ココマデ ####################

#################### Step 2: ダウンロード前の準備ココカラ ####################
print('-' * 50)
print("2. ダウンロード前の準備（アクティベート）")

# setup auth
session = requests.Session()
session.auth = (PLANET_API_KEY, '')

@retry(
    wait_exponential_multiplier=1000,
    wait_exponential_max=10000)
def activate_item(item_id):
    print("attempting to activate: " + item_id)

    # request an item
    item = session.get(
        ("https://api.planet.com/data/v1/item-types/" +
        "{}/items/{}/assets/").format("PSScene", item_id))

    if item.status_code == 429:
        raise Exception("rate limit error")

    # request activation
    result = session.post(
        item.json()["ortho_analytic_8b_sr"]["_links"]["activate"])

    if result.status_code == 429:
        raise Exception("rate limit error")

    print("activation succeeded for item " + item_id)

parallelism = 50

thread_pool = ThreadPool(parallelism)

with open(path_ids) as f: # path_idsは、『実際に検索を実行』で定義したパス。
    item_ids = f.read().splitlines()[:400] # only grab 100

thread_pool.map(activate_item, item_ids)

#################### Step 2: ダウンロード前の準備ココマデ ####################

#################### Step 3: 注文ココカラ ####################
print('-' * 50)
print("3. 注文")

# Setup the session
session = requests.Session()

# Authenticate
session.auth = (PLANET_API_KEY, "")

# Establish headers & Orders URL
headers = {'content-type': 'application/json'}
orders_url = 'https://api.planet.com/compute/ops/orders/v2'

### 通信の確認 ###
print("・通信の確認") # 200が返ればOK．

response = requests.get(orders_url, auth=session.auth)
print(response)

# orders = response.json()['orders'] # これまでに作成した注文をリストアップ？なにこれ？
# print(len(orders))

### 注文情報を指定形式へ成形 ###
print("・注文情報を指定形式へ成形")

objective_products = [] # 各々の注文情報の辞書が連なったリストになる。

with open(path_ids) as f:
  for line in f:
    struct_product = { # 1つの画像の注文情報をまとめた辞書。
      "item_ids": [line.rstrip('\n')],
      "item_type": "PSScene",
      "product_bundle": "analytic_8b_sr_udm2" # Corrected for surface reflectance – recommended for most analytic applications, 8 band
      }
    objective_products.append(struct_product)
print("objective_products =", objective_products)

### クリッピングを含めた注文を作成（★オーダー名変更はココ） ###
print("・クリッピングを含めた注文を作成（★オーダー名変更はココ）")

JST = timezone(timedelta(hours=9))
dt_now = datetime.now(JST)

clip_aoi = {
    "type":"Polygon",
    "coordinates":[MY_AOI]
}

# define the clip tool
clip = {
    "clip": {
        "aoi": clip_aoi
    }
}

# create an order request with the clipping tool
request_clip = {
  "name": dt_now.isoformat(timespec="seconds") + '_ordered',
  "products": objective_products,
  "tools": [clip]
}

# print(json.dumps(request_clip, indent=4, ensure_ascii=False))

### 1つのzipでダウンロードするための設定を注文に追加 ###
print("・1つのzipでダウンロードするための設定を注文に追加")

zip_delivery = {"delivery": {"single_archive": True, "archive_type": "zip"}}
request_clip_zip = request_clip.copy()
request_clip_zip.update(zip_delivery)

print(json.dumps(request_clip_zip, indent=4, ensure_ascii=False))

### いざ注文 ###
print("・いざ注文")

def place_order(request, auth):
    response = requests.post(orders_url, data=json.dumps(request), auth=auth, headers=headers)
    print(response)

    print('"' * 3)
    # レスポンスをJSONとして解析
    result_json = response.json()
    # 成形して中身を全て表示（細かいメタデータも含んでるよ。）
    formatted_json = json.dumps(result_json, indent=2)
    print(formatted_json)
    print('"' * 3)

    order_id = response.json()['id']
    print(order_id)
    order_url = orders_url + '/' + order_id
    return order_url

order_url = place_order(request_clip_zip, session.auth)
print(order_url)
print(type(order_url))

### 注文処理の状態をポーリング ###
print("・注文処理の状態をポーリング")

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

poll_for_success(order_url, auth=session.auth)

### 納品内容を表示 ###
print("・納品内容を表示")

r = requests.get(order_url, auth=session.auth)
response = r.json()
results = response['_links']['results']

print([r['name'] for r in results])

#################### Step 3: 注文ココマデ ####################

#################### Step 4: ダウンロードココカラ ####################

def download_results(results, overwrite=False):
    results_urls = [r['location'] for r in results]
    results_names = [r['name'] for r in results]
    print('{} items to download'.format(len(results_urls)))

    for url, name in zip(results_urls, results_names):
        path = pathlib.Path(os.path.join('data', name))

        if overwrite or not path.exists():
            print('downloading {} to {}'.format(name, path))
            r = requests.get(url, allow_redirects=True)
            path.parent.mkdir(parents=True, exist_ok=True)
            open(path, 'wb').write(r.content)
        else:
            print('{} already exists, skipping {}'.format(path, name))

download_results(results)

#################### Step 4: ダウンロードココマデ ####################
