const BASE_URL = "http://127.0.0.1:8000";

export async function parseNaturalTodo(text) {
    const res = await fetch(`${BASE_URL}/parse_task`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: text }),
    });
    if (!res.ok) throw new Error("自然言語解析に失敗しました");
    return await res.json();
}

export async function suggestSchedule(todos, token) {
    const res = await fetch(`${BASE_URL}/suggest_schedule`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(todos),
    });
    if (!res.ok) throw new Error("スケジュール提案に失敗しました");
    return await res.json();
}
