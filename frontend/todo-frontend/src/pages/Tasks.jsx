import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Tasks() {
    const [todos, setTodos] = useState([]);
    const navigate = useNavigate();
    const [editingId, setEditingId] = useState(null);
    const [editingTodo, setEditingTodo] = useState({ title: "", description: "", status: "", deadline: "" });

    async function fetchTasks() {
        const res = await fetch("http://127.0.0.1:8000/tasks", {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        });
        
        if (res.ok){
            const data = await res.json();
            setTodos(data);
        }else{
            console.warn("トークンが無効または期限切れです。ログインし直してください");
            navigate("/login");
        }
    }

    useEffect(() => {
        fetchTasks();
    }, []);

    const [newTodo, setNewTodo] = useState({
        title: "",
        status: "未着手",
        deadline: "",
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setNewTodo({ ...newTodo, [name]: value });
    };

    const handleAdd = async () => {
        if (!newTodo.title || !newTodo.deadline) return;

        const response = await fetch("http://127.0.0.1:8000/tasks", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify(newTodo),
        });

        if (response.ok) {
            const created = await response.json();
            setTodos([...todos, created]);
            setNewTodo({ title: "", status: "未着手", deadline: "" });
        } else {
            alert("ToDoの追加に失敗しました");
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
        } else {
            alert("削除に失敗しました");
        }
    };

    const handleUpdate = async (id) => {
        const updatedTask = {
            title: editingTodo.title,
            description: editingTodo.description,
            status: editingTodo.status,
            deadline: editingTodo.deadline,
        };

        console.log(updatedTask);

        const res = await fetch(`http://127.0.0.1:8000/tasks/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify(updatedTask),
        });

        if (res.ok) {
            const updated = await res.json();
            setTodos(todos.map((t) => (t.id === id ? updated : t)));
            setEditingId(null);
        } else {
            alert("更新に失敗しました");
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
                                    onChange={(e) => setEditingTodo({ ...editingTodo, title: e.target.value })}
                                    className="w-full p-1 border mb-1"
                                />
                                <input
                                    type="text"
                                    name="description"
                                    value={editingTodo.description}
                                    onChange={(e) => setEditingTodo({ ...editingTodo, description: e.target.value })}
                                    placeholder="詳細"
                                    className="w-full p-1 border mb-1"
                                />
                                <input
                                    type="date"
                                    name="deadline"
                                    value={editingTodo.deadline}
                                    onChange={(e) => setEditingTodo({ ...editingTodo, deadline: e.target.value })}
                                    className="w-full p-1 border mb-1"
                                />
                                <select
                                    name="status"
                                    value={editingTodo.status}
                                    onChange={(e) => setEditingTodo({ ...editingTodo, status: e.target.value })}
                                    className="w-full p-1 border mb-2"
                                >
                                    <option value="未着手">未着手</option>
                                    <option value="作業中">作業中</option>
                                    <option value="完了">完了</option>
                                </select>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleUpdate(todo.id)}
                                        className="bg-green-500 text-white px-2 py-1 rounded"
                                    >
                                        保存
                                    </button>
                                    <button
                                        onClick={() => setEditingId(null)}
                                        className="bg-gray-400 text-white px-2 py-1 rounded"
                                    >
                                        キャンセル
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="text-lg font-semibold">{todo.title}</div>
                                <div className="text-sm text-gray-600">状態: {todo.status}</div>
                                <div className="text-sm text-gray-600">期限: {todo.deadline}</div>
                                <div className="flex gap-4 mt-2">
                                    <button
                                        onClick={() => {
                                            setEditingId(todo.id);
                                            setEditingTodo({
                                                title: todo.title,
                                                description: todo.description || "",
                                                status: todo.status,
                                                deadline: todo.deadline,
                                            });
                                        }}
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
                className="mb-6 bg-red-500 text-white px-4 py-2 rounded"
            >
                ログアウト
            </button>
        </div>
    );
}

export default Tasks;
