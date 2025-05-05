"use client";

import { useState } from "react";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    // フォームが送信された時の処理
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // ここでAPIにPOSTしてログイン処理
        console.log("ログイン:", { username, password });
    };

    return (
        <div
            className="min-h-screen bg-cover bg-top flex items-center justify-center"
            style={{ backgroundImage: 'url(/login-bg.jpg)' }} // public/login-bg.jpg に画像を置いてね
        >
            <div className="bg-white bg-opacity-80 rounded-2xl shadow-xl p-8 w-full max-w-md mx-4">
                <h1 className="text-2xl font-bold mb-6 text-center text-green-800 text-4xl italic">Agri-Eye</h1>
                <form className="space-y-4">
                    <div>
                        <label className="block text-gray-700">メールアドレス</label>
                        <input
                            type="email"
                            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="example@example.com"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700">パスワード</label>
                        <input
                            type="password"
                            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder=""
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-green-600 hover:bg-green-500 text-white py-2.5 rounded-md transition text-xl"
                    >
                        ログイン
                    </button>
                    <button
                        type="submit"
                        className="w-full bg-white-900 hover:bg-gray-300 text-green-600 py-2.5 rounded-md transition text-xl border border-green-600"
                    >
                        新規登録
                    </button>
                </form>
            </div>
        </div>
    );
}
