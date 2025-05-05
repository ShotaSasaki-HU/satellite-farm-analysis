// app/lib/auth.ts

export async function login(email: string, password: string) {
    const res = await fetch("http://127.0.0.1:8000/login", {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
        throw new Error("ログイン失敗");
    }

    return await res.json();
}
