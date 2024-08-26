import { useNavigate } from "react-router-dom";
import { useAuth } from "../provider/authProvider";

export default function Logout() {
    const { setToken } = useAuth();
    const navigate = useNavigate();
    setToken();
    navigate("/login", { replace: true });
};

