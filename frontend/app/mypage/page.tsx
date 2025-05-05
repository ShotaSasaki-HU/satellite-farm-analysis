// app/dashboard/page.tsx
"use client";

import { useState } from "react";
import { User, Map, ChartLine, CircleChevronLeft, CircleChevronRight } from "lucide-react";

export default function Dashboard() {
    const [selected, setSelected] = useState<string>("account"); // サイドバーの選択状態
    const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true); // サイドバーの開閉状態

    return (
        <div className="min-h-screen bg-white flex">
            {/* Sidebar */}
            <div className={`${isSidebarOpen ? "w-64" : "w-25"} transition-all duration-300 px-4 pt-4 shadow-lg`}>
                <div className={`flex items-center h-16 ${isSidebarOpen ? "justify-between": "justify-center"}`}>
                    <h2 className={`text-2xl text-center font-bold py-2 truncate ${isSidebarOpen ? "" : "hidden"}`}>メニュー</h2>
                    <button
                        className="text-gray-500"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)} // 開閉のトグル
                    >
                        {isSidebarOpen ? <CircleChevronLeft className="w-10 h-10" /> : <CircleChevronRight className="w-10 h-10" />}
                    </button>
                </div>
                <ul className="text-xl">
                    <li
                        className={`flex items-center gap-2 p-3 my-1 border-2 hover:border-green-300 rounded-xl cursor-pointer truncate ${selected === "account" ? "bg-green-100 border-green-300" : "border-gray-300"}`}
                        onClick={() => setSelected("account")}
                    >
                        <User className="w-10 h-10 shrink-0" />{isSidebarOpen && "アカウント情報"}
                    </li>
                    <li
                        className={`flex items-center gap-2 p-3 my-1 border-2 hover:border-green-300 rounded-xl cursor-pointer truncate ${selected === "map" ? "bg-green-100 border-green-300" : "border-gray-300"}`}
                        onClick={() => setSelected("map")}
                    >
                        <Map className="w-10 h-10 shrink-0" />{isSidebarOpen && "農地を選ぶ"}
                    </li>
                    <li
                        className={`flex items-center gap-2 p-3 my-1 border-2 hover:border-green-300 rounded-xl cursor-pointer truncate ${selected === "analyze" ? "bg-green-100 border-green-300" : "border-gray-300"}`}
                        onClick={() => setSelected("analyze")}
                    >
                        <ChartLine className="w-10 h-10 shrink-0" />{isSidebarOpen && "農地を分析する"}
                    </li>
                </ul>
            </div>

            {/* Main area */}
            <div className="main flex-1 p-6">
                <h1 className="text-3xl font-bold mb-6 text-green-800 italic">Agri-Eye</h1>
                {selected === "account" && (
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-green-800">アカウント情報</h1>
                        <p>ご自身のアカウント情報を確認できます。</p>
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
    );
}
