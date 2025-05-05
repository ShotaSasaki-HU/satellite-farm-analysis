"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/auth"; // login関数

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [error, setError] = useState<string>("");

    // フォーム送信の処理
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // APIにPOSTしてログイン処理
        try {
            const data = await login(email, password);
            console.log("ログイン成功", data);
            router.push("/mypage")
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div
            className="min-h-screen bg-cover bg-top flex items-center justify-center"
            style={{ backgroundImage: 'url(/login-bg.jpg)' }} // public/login-bg.jpg に画像を置いてね
        >
            <div className="bg-white bg-opacity-80 rounded-2xl shadow-xl p-8 w-full max-w-md mx-4">
                <h1 className="text-2xl font-bold mb-6 text-center text-green-800 text-4xl italic">Agri-Eye</h1>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-gray-700">メールアドレス</label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="example@example.com"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700">パスワード</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder=""
                        />
                    </div>
                    <p className={`${error === "" ? "hidden" : "text-red-500 font-bold text-center"}`}>
                        メールアドレスかパスワードが間違っています。
                    </p>
                    <button
                        type="submit"
                        className="w-full bg-green-600 hover:bg-green-500 text-white py-2.5 rounded-md transition text-xl"
                    >
                        ログイン
                    </button>
                </form>
                <button
                    type="submit"
                    className="w-full bg-white-900 hover:bg-gray-300 text-green-600 mt-4 py-2.5 rounded-md transition text-xl border border-green-600"
                >
                    新規登録
                </button>
            </div>
        </div>
    );
}
