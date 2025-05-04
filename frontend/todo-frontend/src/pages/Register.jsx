import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Register() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleRegister = async () => {
        const res = await fetch("http://127.0.0.1:8000/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({ username, password }),
        });

        if (res.ok) {
            alert("登録成功！");
            navigate("/login");
        } else {
            alert("登録失敗");
        }
    };

    return (
        <div className="p-4 max-w-md mx-auto mt-10">
            <h2 className="text-xl font-bold mb-4">ユーザー登録</h2>
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
                className="w-full bg-green-500 text-white p-2 rounded"
                onClick={handleRegister}
            >
                登録
            </button>
        </div>
    );
}

export default Register;
