"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import { FeatureCollection } from "geojson";

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
      properties: {},
    },
  ],
};

export default function Map() {
  return (
    <MapContainer center={[34.539287209, 133.181980543]} zoom={17} style={{ height: "100vh", width: "100%" }}>
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <GeoJSON
        data={geoJsonData}
        style={() => ({
            color: "red",         // 枠線の色
            weight: 2,             // 枠線の太さ
            fillColor: "red",  // 塗りつぶしの色
            fillOpacity: 0.4,      // 塗りつぶしの透明度
        })}
      />
    </MapContainer>
  );
}
