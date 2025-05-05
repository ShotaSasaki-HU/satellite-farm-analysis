// app/mypage/page.tsx
"use client";

import { useState, useEffect } from "react";
import { User, Map, ChartLine, CircleChevronLeft, CircleChevronRight, LogOut } from "lucide-react";

export default function Mypage() {
    const [selected, setSelected] = useState<string>("account"); // サイドバーの選択状態
    const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true); // サイドバーの開閉状態
    const [userName, setUserName] = useState<string>("");
    const [userEmail, setUserEmail] = useState<string>("");

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
                setUserName(data.name); // バックエンドから返ってくるキーに合わせる
                setUserEmail(data.email);
            } catch (error) {
                console.error("通信エラー:", error);
            }
        };

        fetchProfile(); // useEffectは非同期にできないので中で非同期として定義して呼び出す。
    }, []); // 空の配列は「最初の1回だけ実行する」という意味。変数を入れとくとそれを監視して更新してくれる。

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

    return (
        <div className="min-h-screen bg-white flex">
            {/* Sidebar */}
            <div className={`${isSidebarOpen ? "w-64" : "w-25"} transition-all duration-300 px-4 pt-4 shadow-lg flex flex-col justify-between select-none truncate`}>
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
                            className={`flex items-center gap-2 p-3 my-1 border-2 hover:border-green-300 rounded-xl cursor-pointer ${selected === "account" ? "bg-green-100 border-green-300" : "border-gray-300"}`}
                            onClick={() => setSelected("account")}
                        >
                            <User className="w-10 h-10 shrink-0" />{isSidebarOpen && "アカウント情報"}
                        </li>
                        <li
                            className={`flex items-center gap-2 p-3 my-1 border-2 hover:border-green-300 rounded-xl cursor-pointer ${selected === "map" ? "bg-green-100 border-green-300" : "border-gray-300"}`}
                            onClick={() => setSelected("map")}
                        >
                            <Map className="w-10 h-10 shrink-0" />{isSidebarOpen && "農地を選ぶ"}
                        </li>
                        <li
                            className={`flex items-center gap-2 p-3 my-1 border-2 hover:border-green-300 rounded-xl cursor-pointer ${selected === "analyze" ? "bg-green-100 border-green-300" : "border-gray-300"}`}
                            onClick={() => setSelected("analyze")}
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
            </div>

            {/* Main area */}
            <div className="main flex-1 p-6">
                <div className="select-none">
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-3xl font-bold text-green-800 italic">Agri-Eye</h1>
                        <p className="text-xl">{userName} 様</p>
                    </div>
                    {selected === "account" && (
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
                    {selected === "map" && (
                        <div className="text-center">
                            <h1 className="text-3xl font-bold text-green-800">農地を選ぶ</h1>
                            <p>地図を使って農地（関心領域）を選びます。</p>
                        </div>
                    )}
                    {selected === "analyze" && (
                        <div className="text-center">
                            <h1 className="text-3xl font-bold text-green-800">農地を分析する</h1>
                            <p>選んだ農地（関心領域）の分析を行います。</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
