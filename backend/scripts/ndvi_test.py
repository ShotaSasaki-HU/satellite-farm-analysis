import rasterio
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

#################### NDVIの計算ココカラ ####################

file_path = "/Users/shotasasaki/Documents/Planet/20230315_psscene_analytic_8b_sr_udm2/PSScene/20230315_010339_39_24c2_3B_AnalyticMS_SR_8b.tif"
udm2_path = "/Users/shotasasaki/Documents/Planet/20230315_psscene_analytic_8b_sr_udm2/PSScene/20230315_010339_39_24c2_3B_udm2.tif"

# GeoTIFFを開く
with rasterio.open(file_path) as src:
    # バンド数
    print(f"バンド数: {src.count}")
    # サイズ
    print(f"width: {src.width}, height: {src.height}")
    # 緯度経度の情報
    print(src.crs)
    print(src.descriptions)

    # coastal_blue = src.read(1, masked=True)
    # blue = src.read(2, masked=True)
    # green_i = src.read(3, masked=True)
    # green = src.read(4, masked=True)
    # yellow = src.read(5, masked=True)
    red = src.read(6, masked=True)
    # rededge = src.read(7, masked=True)
    nir = src.read(8, masked=True)

# NDVIを計算（浮動小数点にキャスト）
red = red.astype(np.float32)
nir = nir.astype(np.float32)
ndvi = (nir - red) / (nir + red + 1e-6) # 0除算対策あり

# UDM2によるマスク
with rasterio.open(udm2_path) as udm2:
    clear_mask = udm2.read(1) # 真偽値

ndvi = np.where(clear_mask == 1, ndvi, np.nan)

#################### NDVIの計算ココマデ ####################

#################### 基本統計量の確認ココカラ ####################

# print(pd.DataFrame(pd.Series(red.ravel()).describe()).transpose())
# print(pd.DataFrame(pd.Series(nir.ravel()).describe()).transpose())
print(pd.DataFrame(pd.Series(ndvi.ravel()).describe()).transpose())

# NDVIのヒストグラム
# plt.hist(ndvi.flatten(), bins=100, color='gray')
# plt.title('NDVI Histogram')
# plt.xlabel('NDVI Value')
# plt.ylabel('Pixel Count')
# plt.show()

#################### 基本統計量の確認ココマデ ####################

#################### NDVIの可視化ココカラ ####################

# NDVIを可視化
fig = plt.figure(figsize=(40, 30))
# fig = plt.figure(figsize=(8, 6))
plt.imshow(
    ndvi,
    cmap = 'RdYlGn',
    # vmin = ndvi.mean() - (2 * ndvi.std()),
    vmin = 0,
    vmax = 1
    )
plt.colorbar()
plt.title('NDVI')
plt.savefig('NDVI_test.png', bbox_inches='tight')
# plt.show()

#################### NDVIの可視化ココマデ ####################
