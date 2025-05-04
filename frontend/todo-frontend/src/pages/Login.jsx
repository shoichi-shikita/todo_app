import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleLogin = async () => {
        const res = await fetch("http://127.0.0.1:8000/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({ username, password }),
        });
        const data = await res.json();
        if (data.access_token) {
            localStorage.setItem("token", data.access_token);
            navigate("/tasks");
        } else {
            alert("ログイン失敗");
        }
    };

    return (
        <div className="p-4 max-w-md mx-auto mt-10">
            <h2 className="text-xl font-bold mb-4">ログイン</h2>
            <input
                type="text"
                placeholder="ユーザー名"
                className="w-full p-2 mb-2 border"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
            />
            <input
                type="password"
                placeholder="パスワード"
                className="w-full p-2 mb-2 border"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            <button
                className="w-full bg-blue-500 text-white p-2 rounded"
                onClick={handleLogin}
            >
                ログイン
            </button>
            <p className="mt-4 text-sm text-center">
                アカウントをお持ちでない方は{" "}
                <a href="/register" className="text-blue-500 hover:underline">
                    新規登録
                </a>
            </p>

        </div>

    );
}

export default Login;
