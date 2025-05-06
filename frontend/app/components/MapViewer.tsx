"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, GeoJSON, useMapEvents } from "react-leaflet";
import { FeatureCollection } from "geojson";
import { useState } from "react";
import { features } from "process";

// 視点近傍の筆ポリゴンを取得（地図イベント監視 + API送信）
function MapEventHandler({ setFeatures }: { setFeatures: (f: FeatureCollection) => void }) {
  const [lastSentTime, setLastSentTime] = useState(0);

  // useMapEventsは、地図の状態を監視するためのReact Leafletのフック。
  useMapEvents({
    moveend(e) {
      const map = e.target;
      const center = map.getCenter();
      const zoom = map.getZoom();

      const now = Date.now();
      if (now - lastSentTime < 5000) return; // N秒間隔に制限

      setLastSentTime(now);

      console.log(`リクエスト中：http://localhost:8000/fudes?lat=${center.lat}&lon=${center.lng}&zoom=${zoom}`);
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
          setFeatures(data as FeatureCollection);
        });
    },
  });

  return null;
}

export default function Map() {
  const [features, setFeatures] = useState<FeatureCollection | null>(null); // オーバーレイする筆ポリゴン

  return (
    <MapContainer
      center={[38.25543637637949, 138.50037936515133]}
      zoom={5}
      style={{ height: "100vh", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {features && (
        <>
          {console.log("描画対象 features:", features)}
          <GeoJSON
            key={JSON.stringify(features)}
            data={features}
            style={() => ({
              color: "red",
              weight: 2,
              fillColor: "red",
              fillOpacity: 0.4,
            })}
          />
        </>
      )}

      <MapEventHandler setFeatures={setFeatures} />
    </MapContainer>
  );
}
