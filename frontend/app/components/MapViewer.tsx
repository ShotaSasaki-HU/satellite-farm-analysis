"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, GeoJSON, useMapEvents } from "react-leaflet";
import { FeatureCollection } from "geojson";
import { useState } from "react";

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
          setFeatures(data);
        });
    },
  });

  return null;
}

export default function Map() {
  const [features, setFeatures] = useState<FeatureCollection | null>(
    {
      type: "FeatureCollection",
      "features": [
        {
            "type": "Feature",
            "geometry": {
                "type": "Polygon",
                "coordinates": [
                    [
                        [
                            141.258993791,
                            43.043309391
                        ],
                        [
                            141.259104712,
                            43.043265979
                        ],
                        [
                            141.259260083,
                            43.043216933
                        ],
                        [
                            141.259395222,
                            43.043224402
                        ],
                        [
                            141.259562688,
                            43.043224276
                        ],
                        [
                            141.259635724,
                            43.043221759
                        ],
                        [
                            141.259755938,
                            43.043222799
                        ],
                        [
                            141.259910676,
                            43.043213115
                        ],
                        [
                            141.260046397,
                            43.04318437
                        ],
                        [
                            141.26025518,
                            43.043151531
                        ],
                        [
                            141.260480808,
                            43.04313931
                        ],
                        [
                            141.26059895,
                            43.043135607
                        ],
                        [
                            141.260788742,
                            43.043067334
                        ],
                        [
                            141.260856628,
                            43.043051387
                        ],
                        [
                            141.260916996,
                            43.043034333
                        ],
                        [
                            141.260907788,
                            43.043021501
                        ],
                        [
                            141.260801318,
                            43.042877804
                        ],
                        [
                            141.260745625,
                            43.042780739
                        ],
                        [
                            141.260700268,
                            43.042753052
                        ],
                        [
                            141.260637435,
                            43.04274411
                        ],
                        [
                            141.26047944,
                            43.042778438
                        ],
                        [
                            141.260272451,
                            43.042833338
                        ],
                        [
                            141.260125633,
                            43.04288456
                        ],
                        [
                            141.260070374,
                            43.042938672
                        ],
                        [
                            141.259937902,
                            43.042987918
                        ],
                        [
                            141.259854459,
                            43.043014491
                        ],
                        [
                            141.259742663,
                            43.043024022
                        ],
                        [
                            141.259622856,
                            43.04299779
                        ],
                        [
                            141.2594916,
                            43.042971458
                        ],
                        [
                            141.259377178,
                            43.042966268
                        ],
                        [
                            141.259216726,
                            43.042975377
                        ],
                        [
                            141.259041793,
                            43.042994859
                        ],
                        [
                            141.258949864,
                            43.04301506
                        ],
                        [
                            141.258931846,
                            43.043067395
                        ],
                        [
                            141.258946856,
                            43.043201902
                        ],
                        [
                            141.258993791,
                            43.043309391
                        ]
                    ]
                ]
            },
            "properties": {
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
            }
        },
        {
            "type": "Feature",
            "geometry": {
                "type": "Polygon",
                "coordinates": [
                    [
                        [
                            141.265117681,
                            43.034919066
                        ],
                        [
                            141.265156872,
                            43.034988006
                        ],
                        [
                            141.26523037,
                            43.035120377
                        ],
                        [
                            141.265340218,
                            43.035090617
                        ],
                        [
                            141.265345713,
                            43.035084721
                        ],
                        [
                            141.265239223,
                            43.034904521
                        ],
                        [
                            141.265129675,
                            43.034915464
                        ],
                        [
                            141.265117681,
                            43.034919066
                        ]
                    ]
                ]
            },
            "properties": {
                "polygon_uuid": "6c5c49f6-9132-4eff-b3ed-83b6e80155f0",
                "land_type": 100,
                "issue_year": 2024,
                "edit_year": 2020,
                "history": "[{\"筆ポリゴンID\":\"9f0b068d-e5c3-4a79-8084-cc55831a17f9\",\"更新年度\":2023,\"前年同一\":true},[{\"筆ポリゴンID\":\"621d6fda-f8a1-4854-b340-b21fc5d3eca4\",\"更新年度\":2022,\"前年同一\":true},[{\"筆ポリゴンID\":\"55da65d1-5315-46f1-af53-1ff04752dd9a\",\"更新年度\":2021,\"前年同一\":true},{\"筆ポリゴンID\":\"55da65d1-5315-46f1-af53-1ff04752dd9a\",\"発生年度\":2020}]]]",
                "last_polygon_uuid": "9f0b068d-e5c3-4a79-8084-cc55831a17f9",
                "prev_last_polygon_uuid": "621d6fda-f8a1-4854-b340-b21fc5d3eca4",
                "local_government_cd": "011011",
                "point_lng": 141.265233097,
                "point_lat": 43.035008463
            }
        },
      ]
    }
  ); // オーバーレイする筆ポリゴン

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
        <GeoJSON
          data={features}
          style={() => ({
            color: "red",
            weight: 2,
            fillColor: "red",
            fillOpacity: 0.4,
          })}
        />
      )}

      <MapEventHandler setFeatures={setFeatures} />
    </MapContainer>
  );
}
