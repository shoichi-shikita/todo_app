import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Tasks from "./pages/Tasks";
import RequireAuth from "./components/RequireAuth";
import Register from "./pages/Register"

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route
                    path="/tasks"
                    element={
                        <RequireAuth>
                            <Tasks />
                        </RequireAuth>
                    }
                />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
