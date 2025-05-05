// app/dashboard/page.tsx
"use client";

import Link from "next/link";
import { User, Map, ChartLine } from "lucide-react";

export default function Dashboard() {
    return (
        <div className="min-h-screen bg-white py-8 flex">
            <div className="sidebar px-4">
                <h2 className="text-xl text-center font-bold">メニュー</h2>
                <ul className="pr-4 text-xl">
                    <li className="flex items-center gap-2 p-2 hover:bg-gray-200 rounded-xl">
                        <User className="w-10 h-10" />アカウント
                    </li>
                    <li className="border-t border-gray-400"></li> {/* 区切り線 */}

                    <li className="flex items-center gap-2 p-2 hover:bg-gray-200 rounded-xl">
                        <Map className="w-10 h-10" />農地を選ぶ
                    </li>
                    <li className="border-t border-gray-400"></li> {/* 区切り線 */}

                    <li className="flex items-center gap-2 p-2 hover:bg-gray-200 rounded-xl">
                        <ChartLine className="w-10 h-10" />農地を分析する
                    </li>
                </ul>
            </div>
            <div className="main">
                <h1 className="text-3xl font-bold mb-6 text-green-800 text-center">Agri-Eye ダッシュボード</h1>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-700 mb-2">アカウント情報</h2>
                    <div className="bg-gray-100 p-4 rounded shadow">
                        <p>ユーザー名: 仮の名前</p>
                        <p>メールアドレス: example@example.com</p>
                    </div>
                </section>

                <section className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-700 mb-2">関心領域の選択</h2>
                    <Link href="/aoi/select" className="inline-block bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700">
                        地図からAOIを選ぶ
                    </Link>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-gray-700 mb-2">AOIの分析</h2>
                    <Link href="/aoi/analysis" className="inline-block bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700">
                        分析ページへ
                    </Link>
                </section>
            </div>
        </div>
    );
}
