// MapViewer.tsx
"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, GeoJSON, useMapEvents, useMap } from "react-leaflet";
import { FeatureCollection } from "geojson";
import { useState, useEffect } from "react";
import L from "leaflet";

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

      // console.log(`筆ポリゴンをリクエスト中：http://localhost:8000/fudes?lat=${center.lat}&lon=${center.lng}&zoom=${zoom}`);
      fetch(
        `http://localhost:8000/fudes?lat=${center.lat}&lon=${center.lng}&zoom=${zoom}`,
        {
          method: "GET",
          credentials: "include", // Cookie
        }
      )
        .then((res) => res.json())
        .then((data) => {
          // console.log("筆ポリゴン受け取り");
          setFeatureCollection(data as FeatureCollection);
        });
    },
  });

  return null;
}

function SelectedFeatureFitBounds({
  selectedFeatures,
  selectedGA,
  setFeatureCollection
}: {
  selectedFeatures: GeoJSON.Feature[];
  selectedGA: number | null;
  setFeatureCollection: (f: FeatureCollection) => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (!selectedFeatures || selectedFeatures.length === 0) return;

    const latlngs: L.LatLngExpression[] = [];

    selectedFeatures.forEach((feature) => {
      const geom = feature.geometry;
      if (geom.type === "Polygon") { // Geometryはユニオン型より，型チェックを通すためにtypeを絞る．
        const coords = geom.coordinates[0];
        coords.forEach(([lng, lat]) => latlngs.push([lat, lng]));
      } else {
        console.log("SelectedFeatureFitBounds: Feature.geometryの型がPolygonではありません．");
      }
    });

    if (latlngs.length > 0) {
      const bounds = L.latLngBounds(latlngs);
      map.fitBounds(bounds, { padding: [20, 20] });
    }

    // MapEventHandlerは瞬間移動だと発火しないため，ここで再描画する．
    fetch(
      `http://localhost:8000/fudes?lat=${map.getCenter().lat}&lon=${map.getCenter().lng}&zoom=${map.getZoom()}`,
      {
        method: "GET",
        credentials: "include", // Cookie
      }
    )
      .then((res) => res.json())
      .then((data) => {
        // console.log("筆ポリゴン受け取り");
        setFeatureCollection(data as FeatureCollection);
      });
  }, [selectedGA]);

  return null;
}

export default function Map({
  onFeatureClick,
  selectedFeatures,
  selectedGA
}: {
  onFeatureClick: (feature: GeoJSON.Feature) => void;
  selectedFeatures: GeoJSON.Feature[];
  selectedGA: number | null;
}) {
  const [featureCollection, setFeatureCollection] = useState<FeatureCollection | null>(null); // オーバーレイする筆ポリゴン

  const isSelected = (feature: GeoJSON.Feature | undefined) => {
    return selectedFeatures.some(f => f.properties?.polygon_uuid === feature?.properties?.polygon_uuid);
  };

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
            let fillColor = "red";
            let borderColor = "";
            if (landType === 100) {
              borderColor = "#bfa500"; // 黄土色寄りの落ち着いた色
            } else if (landType === 200) {
              borderColor = "darkgreen";
            }

            if (!isSelected(feature)) {
              if (landType === 100) {
                fillColor = "yellow";
              } else if (landType === 200) {
                fillColor = "green";
              }
            }

            return {
              color: borderColor,
              weight: 1.5,
              fillColor: fillColor,
              fillOpacity: 0.5,
            };
          }}
          onEachFeature={(feature, layer) => {
            layer.on("click", () => {
              if (onFeatureClick) {
                onFeatureClick(feature);
              }
            });
          }}
        />
      )}

      <MapEventHandler setFeatureCollection={setFeatureCollection} />
      <SelectedFeatureFitBounds
        selectedFeatures={selectedFeatures}
        selectedGA={selectedGA}
        setFeatureCollection={setFeatureCollection}
      />
    </MapContainer>
  );
}
