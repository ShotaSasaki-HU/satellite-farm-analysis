"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, GeoJSON, useMapEvents } from "react-leaflet";
import { FeatureCollection } from "geojson";
import { useEffect, useState } from "react";

const geoJsonData: FeatureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [133.181980543, 34.539287209],
            [133.181944996, 34.539318275],
            [133.182009215, 34.539364681],
            [133.182044213, 34.539392031],
            [133.182077683, 34.53939749],
            [133.182103217, 34.539372243],
            [133.181980543, 34.539287209]
          ]
        ],
      },
      properties: {
        "polygon_uuid": "1dba1043-38bb-40da-9e88-eb1ef9beaff4",
        "land_type": 200,
        "issue_year": 2024,
        "edit_year": 2020,
        "history": "[{\"筆ポリゴンID\":\"29996564-6256-402b-b48b-5daafda706f5\",\"更新年度\":2023,\"前年同一\":true},[{\"筆ポリゴンID\":\"2b0ef02c-56b4-4c58-851f-b93109a2a288\",\"更新年度\":2022,\"前年同一\":true},[{\"筆ポリゴンID\":\"1260ed49-3d13-479d-8a60-c96b35837a34\",\"更新年度\":2021,\"前年同一\":true},{\"筆ポリゴンID\":\"1260ed49-3d13-479d-8a60-c96b35837a34\",\"発生年度\":2020}]]]",
        "last_polygon_uuid": "29996564-6256-402b-b48b-5daafda706f5",
        "prev_last_polygon_uuid": "2b0ef02c-56b4-4c58-851f-b93109a2a288",
        "local_government_cd": "011011",
        "point_lng": 141.259948641,
        "point_lat": 43.043042925
      },
    },
  ],
};

// 視点近傍の筆ポリゴンを取得（地図イベント監視 + API送信）
function MapEventHandler() {
  const [lastSentTime, setLastSentTime] = useState(0);

  // useMapEventsは、地図の状態を監視するためのReact Leafletのフック。
  useMapEvents({
    moveend(e) {
      const map = e.target;
      const center = map.getCenter();
      const zoom = map.getZoom();

      const now = Date.now();
      if (now - lastSentTime < 1000) return; // 1秒間隔に制限

      setLastSentTime(now);

      // APIに送信（GETでもPOSTでもいい）
      fetch(
        `http://localhost:8000/fudes?lat=${center.lat}&lon=${center.lng}&zoom=${zoom}`,
        {
          method: "GET",
          credentials: "include", // Cookie
        }
      )
        .then((res) => res.json())
        .then((data) => {
          console.log("受け取ったデータ:", data);
          // TODO: 地図に描画するステートに格納
        }
        );
    },
  });

  return null;
}

export default function Map() {
  return (
    <MapContainer
      center={[34.539287209, 133.181980543]}
      zoom={17}
      style={{ height: "100vh", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <GeoJSON
        data={geoJsonData}
        style={() => ({
          color: "red",     // 枠線の色
          weight: 2,        // 枠線の太さ
          fillColor: "red", // 塗りつぶしの色
          fillOpacity: 0.4, // 塗りつぶしの透明度
        })}
      />
      <MapEventHandler />
    </MapContainer>
  );
}
