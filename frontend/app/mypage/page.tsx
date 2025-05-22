// app/mypage/page.tsx
"use client";

import "tailwindcss"; // globals.cssが効いてない？

import { useState, useEffect, useRef } from "react";
import { User, Map, ChartLine, CircleChevronLeft, CircleChevronRight, LogOut, FolderPlus, Trash2, LoaderCircle } from "lucide-react";
import dynamic from "next/dynamic";
import ListItem from "../components/ListItem";
import { FeatureCollection } from "geojson";

const MapViewer = dynamic(() => import("../components/MapViewer"), {
    ssr: false,
});

interface GroupedAoi {
    id: number;
    name: string;
    featureCollection: FeatureCollection;
    status: string; // 分析状態
}

export default function Mypage() {
    const [selectedSidebar, setSelectedSidebar] = useState<string>("account"); // サイドバーの選択状態
    const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true); // サイドバーの開閉状態
    const [userId, setUserId] = useState<number>();
    const [userEmail, setUserEmail] = useState<string>("");
    const [userName, setUserName] = useState<string>("");
    const [groupedAois, setGroupedAois] = useState<GroupedAoi[]>([]); // 作成したグループ（筆ポリゴンを内包）
    const [selectedGA, setSelectedGA] = useState<number | null>(null);
    const selectedGARef = useRef<number | null>(null);
    const [editGroupId, setEditGroupId] = useState<number | null>(null);
    const [editingName, setEditingName] = useState(""); // 編集中の名前

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

            const groups: GroupedAoi[] = await res.json();
            setGroupedAois(groups);
            if ((selectedGA === null || !groups.some(group => group.id === selectedGA)) && groups.length > 0) {
                setSelectedGA(groups[0].id)
            }
        } catch (error) {
            console.error("fetchGetGroupedAoiにおけるエラー:", error);
        }
    };

    // selectedGAの変更監視哨
    useEffect(() => {
        console.log(`$selectedGAの変更: ${selectedGA}`);
        selectedGARef.current = selectedGA; // selectedGAが変わるたびにrefも更新
    }, [selectedGA]);

    const handleFeatureClick = async (feature: GeoJSON.Feature) => {
        const polygonId = feature.properties?.polygon_uuid;
        if (!polygonId) {
            console.log("handleFeatureClick: polygon_uuidが取得できませんでした．");
            return;
        }
        const currentGA = selectedGARef.current;
        if (!currentGA) {
            console.log("handleFeatureClick: selectedGAがnullです．");
            return;
        }
        console.log(`http://localhost:8000/grouped-aoi/${currentGA}/${polygonId}`);
        console.log(feature.geometry);
        const res = await fetch(`http://localhost:8000/grouped-aoi/${currentGA}/${polygonId}`, {
            method: "POST",
            credentials: "include"
        });
        await fetchGetGroupedAoi(); // 作成したグループをDBから取得し直す。
    };

    const startAnalysis = async (group_id: number) => {
        // console.log(`グループ（id: ${group_id}）の分析開始`);
        await fetch(`http://localhost:8000/start-analysis/${group_id}`, {
            method: "POST",
            credentials: "include"
        });
        await fetchGetGroupedAoi(); // ボタンを更新するため．

        const poll = async () => {
            let status = "processing";
            while (status === "processing") {
                await new Promise((r) => setTimeout(r, 3 * 1000));

                // fetchGetGroupedAoiして，groupedAoisでstatusを見ようとしても古いデータしか見れない．
                const res = await fetch("http://localhost:8000/grouped-aoi", {
                    method: "GET",
                    credentials: "include", // これが HttpOnly Cookie の場合に必須
                });
                const data = await res.json();
                const group: GroupedAoi | undefined = data.find(((g: any) => g.id === group_id));
                status = group?.status || "unknown";

                console.log(`group: ${group_id}, status: ${status}`);
            }
        };

        poll();
    };

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
                        <div> {/* divタグ消しちゃだめ？ */}
                            <h1 className="text-3xl font-bold text-green-800 text-center">農地を選ぶ</h1>
                            <p className="text-center">地図を使って農地（関心領域）を選びます。</p>
                            <hr className="border-t border-gray-300 mt-6" />

                            <ul className="flex justify-center items-center mt-6 mb-3 gap-6">
                                <li className="flex items-center">
                                    <div className="border-2 border-[#c0ad3e] bg-[#f7f895] w-8 h-8 rounded"></div>
                                    <span>：田</span>
                                </li>
                                <li className="flex items-center">
                                    <div className="border-2 border-[#c0ad3e] bg-[#ed9186] w-8 h-8 rounded"></div>
                                    <span>：田（選択中）</span>
                                </li>
                                <li className="flex items-center">
                                    <div className="border-2 border-[#2e661d] bg-[#94b685] w-8 h-8 rounded"></div>
                                    <span>：畑</span>
                                </li>
                                <li className="flex items-center">
                                    <div className="border-2 border-[#2e661d] bg-[#ed9186] w-8 h-8 rounded"></div>
                                    <span>：畑（選択中）</span>
                                </li>
                            </ul>
                            <p className="text-right">※グループ名を変更したい場合は，グループ名をダブルクリックして下さい．</p>
                            <div className="flex border-1 border-gray-400">
                                {/* React Leaflet */}
                                <MapViewer
                                    onFeatureClick={handleFeatureClick}
                                    selectedFeatures={
                                        groupedAois.find((g) => g.id === selectedGA)?.featureCollection.features ?? []
                                    }
                                    selectedGA={selectedGA}
                                />

                                {/* 作成したグループ */}
                                <div className="w-80 h-screen flex flex-col">
                                    <h1 className="text-xl text-center font-bold py-2 truncate">作成したグループ</h1>
                                    <hr className="border-t border-gray-300" />
                                    <ul className="flex-1 overflow-y-auto"> {/* スクロールバーは自動 */}
                                        {groupedAois.map((group, index) => (
                                            <ListItem
                                                key={group.id}
                                                main={
                                                    editGroupId === group.id ? ( // 編集中か否か
                                                        <input
                                                            className="border rounded px-2 py-1 w-full"
                                                            value={editingName}
                                                            autoFocus
                                                            onChange={(e) => setEditingName(e.target.value)}
                                                            onBlur={async () => {
                                                                if (editingName !== group.name && editingName.trim() !== "") {
                                                                    await fetch(`http://localhost:8000/rename-grouped-aoi/${group.id}`, {
                                                                        method: "POST",
                                                                        credentials: "include",
                                                                        headers: {
                                                                            "Content-Type": "application/json"
                                                                        },
                                                                        body: JSON.stringify({ name: editingName })
                                                                    });
                                                                    await fetchGetGroupedAoi();
                                                                }
                                                                setEditGroupId(null); // 編集モード終了
                                                            }}
                                                            onKeyDown={async (e) => {
                                                                if (e.key === "Enter") {
                                                                    e.currentTarget.blur(); // blurと同じ動作
                                                                } else if (e.key === "Escape") {
                                                                    setEditGroupId(null); // キャンセル
                                                                }
                                                            }}
                                                        />
                                                    ) : (
                                                        // 編集モードに突入
                                                        <span onDoubleClick={() => {
                                                            setEditGroupId(group.id);
                                                            setEditingName(group.name);
                                                        }}>
                                                            {group.name}
                                                        </span>
                                                    )
                                                }
                                                sub={`id: ${group.id.toString()}, count: ${group.featureCollection ? group.featureCollection.features.length : 0}`}
                                                className={`flex justify-between items-center px-3 py-2 m-1 cursor-pointer border-2 rounded-xl hover:border-green-300 ${selectedGA === group.id ? "bg-green-100 border-green-300" : "border-gray-300"}`}
                                                onClick={() => setSelectedGA(group.id)}
                                                rightElement={null}
                                                onRightClick={() => console.log("右の要素がクリックされた")}
                                            />
                                        ))}

                                        {/* グループ作成ボタン */}
                                        <li
                                            className="flex justify-around items-center my-3"
                                        >
                                            <FolderPlus
                                                className="w-8 h-8 cursor-pointer hover:text-green-400"
                                                onClick={async () => {
                                                    const name = "新しいグループ";
                                                    const res = await fetch(`http://localhost:8000/create-grouped-aoi/${name}`, {
                                                        method: "POST",
                                                        credentials: "include"
                                                    });
                                                    await fetchGetGroupedAoi(); // 作成したグループをDBから取得し直す。
                                                    const new_grouop = await res.json();
                                                    setSelectedGA(new_grouop.id);
                                                }}
                                            />
                                            <Trash2
                                                className="w-8 h-8 cursor-pointe hover:text-red-500"
                                                onClick={async () => {
                                                    if (groupedAois.length > 0) {
                                                        const res = await fetch(`http://localhost:8000/delete-grouped-aoi/${selectedGA}`, {
                                                            method: "POST",
                                                            credentials: "include"
                                                        });
                                                        await fetchGetGroupedAoi(); // 作成したグループをDBから取得し直す。
                                                    }
                                                }}
                                            />
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
                            <hr className="border-t border-gray-300 mt-6" />

                            <h2 className="text-2xl font-bold mt-6 text-left">１．解析するグループを選ぶ</h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                                {groupedAois.map((group) => (
                                    <div key={group.id} className="border rounded-xl p-4 shadow bg-white">
                                        <h3 className="text-lg font-bold">{group.name}</h3>

                                        {group.status === "unprocessed" && (
                                            <button
                                                onClick={() => startAnalysis(group.id)}
                                                className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                                            >
                                                分析開始
                                            </button>
                                        )}

                                        {group.status === "processing" && (
                                            <button
                                                disabled
                                                className="mt-2 px-4 py-2 bg-yellow-500 text-white rounded cursor-not-allowed"
                                            >
                                                <div className="flex justify-center items-center">
                                                    <span className="mr-2">分析中…</span>
                                                    <LoaderCircle className="w-6 h-6 animate-spin" />
                                                </div>
                                            </button>
                                        )}

                                        {group.status === "completed" && (
                                            <button
                                                disabled
                                                className="mt-2 px-4 py-2 bg-gray-400 text-white rounded cursor-not-allowed"
                                            >
                                                分析済み
                                            </button>
                                        )}

                                        {group.status === "failed" && (
                                            <div className="mt-2">
                                                <p className="text-red-600">分析に失敗しました．</p>
                                                <button
                                                    onClick={() => startAnalysis(group.id)}
                                                    className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                                                >
                                                    再分析
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
