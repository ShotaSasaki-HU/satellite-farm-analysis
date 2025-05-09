// app/mypage/page.tsx
"use client";

import { useState, useEffect } from "react";
import { User, Map, ChartLine, CircleChevronLeft, CircleChevronRight, LogOut, FolderPlus } from "lucide-react";
import dynamic from "next/dynamic";
import ListItem from "../components/ListItem";
import { FeatureCollection } from "geojson";

const MapViewer = dynamic(() => import("../components/MapViewer"), {
    ssr: false,
});

export default function Mypage() {
    const [selectedSidebar, setSelectedSidebar] = useState<string>("account"); // サイドバーの選択状態
    const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true); // サイドバーの開閉状態
    const [userId, setUserId] = useState<number>();
    const [userEmail, setUserEmail] = useState<string>("");
    const [userName, setUserName] = useState<string>("");
    const [groupedAois, setGroupedAois] = useState< // 作成したグループ（筆ポリゴンを内包）
        {
            id: number;
            name: string;
            featureCollection: FeatureCollection;
        }[]
    >([]);
    const [selectedGA, setSelectedGA] = useState<number | null>(null);

    // 初期化の処理
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch("http://localhost:8000/profile", {
                    method: "GET",
                    credentials: "include", // これが HttpOnly Cookie の場合に必須
                });

                if (!res.ok) {
                    console.error("プロフィールの取得に失敗しました。");
                    window.location.href = "/login";
                    return;
                }

                const data = await res.json();
                setUserId(data.id);
                setUserEmail(data.email);
                setUserName(data.name);
            } catch (error) {
                console.error("通信エラー:", error);
            }
        };

        fetchProfile(); // useEffectは非同期にできないので中で非同期として定義して呼び出す。
        fetchGetGroupedAoi();
    }, []); // 空の配列は「最初の1回だけ実行する」という意味。変数を入れとくとそれを監視して更新してくれる。

    // ログアウト
    const handleLogout = async () => {
        try {
            const res = await fetch("http://localhost:8000/logout", {
                method: "POST",
                credentials: "include", // HttpOnly Cookie を使っているなら必須
            });

            if (!res.ok) {
                console.error("ログアウトに失敗しました");
                return;
            }

            // 必要なら状態をクリアするなど
            console.log("ログアウト成功");
            setUserName("");
            setUserEmail("");

            // 画面遷移
            window.location.href = "/login"; // 全体をリロードしたいのでrouter.push()ではなくコレを使う。
        } catch (error) {
            console.error("通信エラー:", error);
        }
    };

    // 作成したグループを取得
    const fetchGetGroupedAoi = async () => {
        try {
            const res = await fetch("http://localhost:8000/grouped-aoi", {
                method: "GET",
                credentials: "include", // これが HttpOnly Cookie の場合に必須
            });

            if (!res.ok) {
                console.error("grouped-aoiの取得に失敗しました。");
                return;
            }

            const groups = await res.json();
            setGroupedAois(groups);
            if ((selectedGA === null) && groups.length > 0) {
                setSelectedGA(groups[0].id)
            }
        } catch (error) {
            console.error("通信エラー:", error);
        }
    };

    // selectedGAの変更監視哨
    useEffect(() => {
        console.log(`$selectedGAの変更: ${selectedGA}`);
    }, [selectedGA]);

    return (
        <div className="flex h-screen">
            {/* Sidebar */}
            <aside className={`${isSidebarOpen ? "w-64" : "w-25"} transition-all duration-300 px-4 pt-4 shadow-lg flex flex-col justify-between select-none truncate fixed h-screen`}>
                {/* メニュー上部 */}
                <div>
                    <div className={`flex items-center h-16 ${isSidebarOpen ? "justify-between" : "justify-center"}`}>
                        <h2 className={`text-2xl text-center font-bold py-2 truncate select-none ${isSidebarOpen ? "" : "hidden"}`}>メニュー</h2>
                        <button
                            className="text-gray-500 cursor-pointer"
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)} // 開閉のトグル
                        >
                            {isSidebarOpen ? <CircleChevronLeft className="w-10 h-10" /> : <CircleChevronRight className="w-10 h-10" />}
                        </button>
                    </div>
                    <ul className="text-xl">
                        <li
                            className={`flex items-center gap-2 p-3 my-1 border-2 hover:border-green-300 rounded-xl cursor-pointer ${selectedSidebar === "account" ? "bg-green-100 border-green-300" : "border-gray-300"}`}
                            onClick={() => setSelectedSidebar("account")}
                        >
                            <User className="w-10 h-10 shrink-0" />{isSidebarOpen && "アカウント情報"}
                        </li>
                        <li
                            className={`flex items-center gap-2 p-3 my-1 border-2 hover:border-green-300 rounded-xl cursor-pointer ${selectedSidebar === "map" ? "bg-green-100 border-green-300" : "border-gray-300"}`}
                            onClick={() => setSelectedSidebar("map")}
                        >
                            <Map className="w-10 h-10 shrink-0" />{isSidebarOpen && "農地を選ぶ"}
                        </li>
                        <li
                            className={`flex items-center gap-2 p-3 my-1 border-2 hover:border-green-300 rounded-xl cursor-pointer ${selectedSidebar === "analyze" ? "bg-green-100 border-green-300" : "border-gray-300"}`}
                            onClick={() => setSelectedSidebar("analyze")}
                        >
                            <ChartLine className="w-10 h-10 shrink-0" />{isSidebarOpen && "農地を分析する"}
                        </li>
                    </ul>
                </div>

                {/* メニュー下部（ログアウトボタン） */}
                <ul className="text-xl mb-2.5">
                    <li
                        className="flex items-center gap-2 p-3 my-1 border-2 border-red-300 rounded-xl cursor-pointer"
                        onClick={() => handleLogout()}
                    >
                        <LogOut className="w-10 h-10 shrink-0" />{isSidebarOpen && "ログアウト"}
                    </li>
                </ul>
            </aside>

            {/* Main area */}
            <main className={`flex-1 py-6 pr-6 ${isSidebarOpen ? "pl-70" : "pl-31"} transition-all duration-300`}> {/* pl = asideの幅w + 6 */}
                <div className="select-none">
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-3xl font-bold text-green-800 italic">Agri-Eye</h1>
                        <p className="text-xl">{userName} 様</p>
                    </div>
                    {selectedSidebar === "account" && (
                        <div>
                            <div className="text-center mb-6">
                                <h1 className="text-3xl font-bold text-green-800">アカウント情報</h1>
                                <p>ご自身のアカウント情報を確認できます。</p>
                            </div>
                            <hr className="border-t border-gray-300" />

                            <ul className="flex items-center w-full h-16">
                                <li className="w-[25%] font-bold truncate">名前</li>
                                <li className="flex-1 text-xl truncate">{userName}</li>
                            </ul>
                            <hr className="border-t border-gray-300" />

                            <ul className="flex items-center w-full h-16">
                                <li className="w-[25%] font-bold truncate">メールアドレス</li>
                                <li className="flex-1 text-xl truncate">{userEmail}</li>
                            </ul>
                            <hr className="border-t border-gray-300" />

                            <ul className="flex items-center w-full h-16">
                                <li className="w-[25%] font-bold truncate">電話番号</li>
                                <li className="flex-1 text-xl truncate">未登録</li>
                            </ul>
                            <hr className="border-t border-gray-300" />
                        </div>
                    )}
                    {selectedSidebar === "map" && (
                        <div className="text-center">
                            <h1 className="text-3xl font-bold text-green-800">農地を選ぶ</h1>
                            <p>地図を使って農地（関心領域）を選びます。</p>
                            <div className="flex border-1 border-gray-400">
                                {/* React Leaflet */}
                                <MapViewer
                                    onFeatureClick={(feature) => {
                                        // console.log("選択されたポリゴン:", feature.properties);

                                        (async () => {
                                            const polygonId = feature.properties?.polygon_uuid;
                                            if (!polygonId) {
                                                console.warn("polygon_uuid が取得できませんでした");
                                                return;
                                            }
                                            console.log(`http://localhost:8000/grouped-aoi/${selectedGA}/${polygonId}`);
                                            const res = await fetch(`http://localhost:8000/grouped-aoi/${selectedGA}/${polygonId}`, {
                                                method: "POST",
                                                credentials: "include"
                                            });
                                            await fetchGetGroupedAoi(); // 作成したグループをDBから取得し直す。
                                        })();
                                    }}
                                    selectedFeatures={
                                        groupedAois.find((g) => g.id === selectedGA)?.featureCollection.features ?? []
                                    }
                                />

                                {/* 作成したグループ */}
                                <div className="w-80 h-screen flex flex-col">
                                    <h1 className="text-xl text-center font-bold py-2 truncate">作成したグループ</h1>
                                    <hr className="border-t border-gray-300" />
                                    <ul className="flex-1 overflow-y-auto"> {/* スクロールバーは自動 */}
                                        {groupedAois.map((group, index) => (
                                            <ListItem
                                                key={group.id}
                                                main={group.name}
                                                sub={`id: ${group.id.toString()}, count: ${group.featureCollection ? group.featureCollection.features.length : 0}`}
                                                className={`flex justify-between items-center px-3 py-2 m-1 cursor-pointer border-2 rounded-xl hover:border-green-300 ${selectedGA === group.id ? "bg-green-100 border-green-300" : "border-gray-300"}`}
                                                onClick={() => setSelectedGA(group.id)}
                                            />
                                        ))}

                                        {/* グループ作成ボタン */}
                                        <li
                                            className="flex justify-center items-center cursor-pointer hover:text-green-400 my-3"
                                            onClick={async () => {
                                                const res = await fetch("http://localhost:8000/create-grouped-aoi", {
                                                    method: "POST",
                                                    credentials: "include",
                                                    headers: {
                                                        "Content-Type": "application/json",
                                                    },
                                                    body: JSON.stringify({ name: "新しいグループ" }),
                                                });
                                                await fetchGetGroupedAoi(); // 作成したグループをDBから取得し直す。
                                                const new_grouop = await res.json();
                                                setSelectedGA(new_grouop.id);
                                            }}
                                        >
                                            <FolderPlus className="w-8 h-8" />
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                    {selectedSidebar === "analyze" && (
                        <div className="text-center">
                            <h1 className="text-3xl font-bold text-green-800">農地を分析する</h1>
                            <p>選んだ農地（関心領域）の分析を行います。</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
