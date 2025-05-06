import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { parseNaturalTodo, suggestSchedule } from "../api/ai";

function Tasks() {
    const [todos, setTodos] = useState([]);
    const [nlText, setNlText] = useState("");
    const [newTodo, setNewTodo] = useState({
        title: "",
        status: "未着手",
        deadline: "",
        priority: "中",
    });
    const [editingId, setEditingId] = useState(null);
    const [editingTodo, setEditingTodo] = useState({});
    const navigate = useNavigate();

    const fetchTasks = async () => {
        const res = await fetch("http://127.0.0.1:8000/tasks", {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        });
        if (res.status === 401) {
            navigate("/login");
            return;
        }
        const data = await res.json();
        const sorted = data.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
        setTodos(sorted);
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setNewTodo({ ...newTodo, [name]: value });
    };

    const handleAdd = async () => {
        if (!newTodo.title || !newTodo.deadline) return;
        const res = await fetch("http://127.0.0.1:8000/tasks", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify(newTodo),
        });
        if (res.ok) {
            const created = await res.json();
            setTodos([...todos, created]);
            setNewTodo({ title: "", status: "未着手", deadline: "", priority: "中" });
        } else {
            alert("追加に失敗しました");
        }
    };

    const handleDelete = async (id) => {
        const res = await fetch(`http://127.0.0.1:8000/tasks/${id}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });
        if (res.ok) {
            setTodos(todos.filter((todo) => todo.id !== id));
        }
    };

    const startEditing = (todo) => {
        setEditingId(todo.id);
        setEditingTodo({ ...todo });
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditingTodo({});
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditingTodo({ ...editingTodo, [name]: value });
    };

    const saveEdit = async () => {
        const res = await fetch(`http://127.0.0.1:8000/tasks/${editingId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify(editingTodo),
        });
        if (res.ok) {
            const updated = await res.json();
            setTodos(todos.map((todo) => (todo.id === editingId ? updated : todo)));
            setEditingId(null);
        } else {
            alert("編集に失敗しました");
        }
    };

    // 自然言語からToDo追加
    const handleNaturalInput = async () => {
        try {
            const parsed = await parseNaturalTodo(nlText);
            const res = await fetch("http://127.0.0.1:8000/tasks", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify(parsed),
            });
            if (res.ok) {
                const created = await res.json();
                setTodos([...todos, created]);
                setNlText("");
            }
        } catch (err) {
            alert(err.message);
        }
    };
    // スケジュール提案
    const handleSuggest = async () => {
        try {
            const suggestions = await suggestSchedule(todos, localStorage.getItem("token"));
            alert("👀 今日やるべきタスク:\n" + suggestions.map(d => `・${d.title}（理由: ${d.reason}）`).join("\n"));
        } catch (err) {
            alert(err.message);
        }
    };

    return (
        <div className="max-w-2xl mx-auto mt-10 p-4">
            <h1 className="text-2xl font-bold mb-4">📋 ToDoリスト</h1>

            <ul className="space-y-4 mb-6">
                {todos.map((todo) => (
                    <li key={todo.id} className="p-4 border rounded shadow">
                        {editingId === todo.id ? (
                            <>
                                <input
                                    type="text"
                                    name="title"
                                    value={editingTodo.title}
                                    onChange={handleEditChange}
                                    className="w-full mb-2 p-2 border"
                                />
                                <input
                                    type="date"
                                    name="deadline"
                                    value={editingTodo.deadline}
                                    onChange={handleEditChange}
                                    className="w-full mb-2 p-2 border"
                                />
                                <select
                                    name="status"
                                    value={editingTodo.status}
                                    onChange={handleEditChange}
                                    className="w-full mb-2 p-2 border"
                                >
                                    <option value="未着手">未着手</option>
                                    <option value="作業中">作業中</option>
                                    <option value="完了">完了</option>
                                </select>
                                <select
                                    name="priority"
                                    value={editingTodo.priority}
                                    onChange={handleEditChange}
                                    className="w-full mb-2 p-2 border"
                                >
                                    <option value="高">高</option>
                                    <option value="中">中</option>
                                    <option value="低">低</option>
                                </select>
                                <div className="flex gap-2">
                                    <button className="bg-green-500 text-white px-4 py-1 rounded" onClick={saveEdit}>
                                        保存
                                    </button>
                                    <button className="bg-gray-400 text-white px-4 py-1 rounded" onClick={cancelEditing}>
                                        キャンセル
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="text-lg font-semibold">{todo.title}</div>
                                <div className="text-sm text-gray-600">状態: {todo.status}</div>
                                <div className="text-sm text-gray-600">期限: {todo.deadline}</div>
                                <div className="text-sm text-gray-600">優先度: {todo.priority}</div>
                                <div className="mt-2 flex gap-4">
                                    <button
                                        onClick={() => startEditing(todo)}
                                        className="text-blue-500 hover:underline"
                                    >
                                        編集
                                    </button>
                                    <button
                                        onClick={() => handleDelete(todo.id)}
                                        className="text-red-500 hover:underline"
                                    >
                                        削除
                                    </button>
                                </div>
                            </>
                        )}
                    </li>
                ))}
            </ul>

            <div className="space-y-2">
                <input
                    type="text"
                    name="title"
                    value={newTodo.title}
                    onChange={handleChange}
                    placeholder="タイトル"
                    className="w-full p-2 border rounded"
                />
                <input
                    type="date"
                    name="deadline"
                    value={newTodo.deadline}
                    onChange={handleChange}
                    className="w-full p-2 border rounded"
                />
                <select
                    name="status"
                    value={newTodo.status}
                    onChange={handleChange}
                    className="w-full p-2 border rounded"
                >
                    <option value="未着手">未着手</option>
                    <option value="作業中">作業中</option>
                    <option value="完了">完了</option>
                </select>
                <select
                    name="priority"
                    value={newTodo.priority}
                    onChange={handleChange}
                    className="w-full p-2 border rounded"
                >
                    <option value="高">高</option>
                    <option value="中">中</option>
                    <option value="低">低</option>
                </select>
                <button
                    onClick={handleAdd}
                    className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
                >
                    ToDo追加
                </button>
            </div>

            <button
                onClick={() => {
                    localStorage.removeItem("token");
                    navigate("/login");
                }}
                className="mt-6 bg-red-500 text-white px-4 py-2 rounded"
            >
                ログアウト
            </button>

            <div className="mt-6 space-y-2">
                <input
                    type="text"
                    placeholder="例: 明日の10時に歯医者"
                    value={nlText}
                    onChange={(e) => setNlText(e.target.value)}
                    className="w-full p-2 border rounded"
                />
                <button
                    onClick={handleNaturalInput}
                    className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600"
                >
                    🧠 自然言語からToDo追加
                </button>
            </div>
        </div>
    );
}

export default Tasks;
