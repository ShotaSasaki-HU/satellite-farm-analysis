"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, GeoJSON, useMapEvents } from "react-leaflet";
import { FeatureCollection } from "geojson";
import { useState } from "react";

// 視点近傍の筆ポリゴンを取得（地図イベント監視 + API送信）
function MapEventHandler({ setFeatureCollection }: { setFeatureCollection: (f: FeatureCollection) => void }) {
  const [lastSentTime, setLastSentTime] = useState(0);

  // useMapEventsは、地図の状態を監視するためのReact Leafletのフック。
  useMapEvents({
    moveend(e) { // パン・ズーム操作が終わった時だけ発火
      const map = e.target;
      const center = map.getCenter();
      const zoom = map.getZoom();

      const now = Date.now();
      if (now - lastSentTime < 1000) return; // N秒間隔に制限

      setLastSentTime(now);

      fetch(
        `http://localhost:8000/fudes?lat=${center.lat}&lon=${center.lng}&zoom=${zoom}`,
        {
          method: "GET",
          credentials: "include", // Cookie
        }
      )
        .then((res) => res.json())
        .then((data) => {
          setFeatureCollection(data as FeatureCollection);
        });
    },
  });

  return null;
}

export default function Map() {
  const [featureCollection, setFeatureCollection] = useState<FeatureCollection | null>(null); // オーバーレイする筆ポリゴン

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

      {featureCollection && (
        <GeoJSON
          key={JSON.stringify(featureCollection)}
          data={featureCollection}
          style={(feature) => { // featureには、GeoJSONの中の各Featureオブジェクトが1つずつ引数として渡される。
            const landType = feature?.properties.land_type;
            let fill_color = "red";

            if (landType === 100) {
              fill_color = "yellow";
            } else if (landType === 200) {
              fill_color = "green";
            }

            return {
              color: "gray",
              weight: 1.5,
              fillColor: fill_color,
              fillOpacity: 0.6,
            };
          }}
        />
      )}

      <MapEventHandler setFeatureCollection={setFeatureCollection} />
    </MapContainer>
  );
}
