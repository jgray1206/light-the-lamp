import { useAuth } from "../provider/authProvider";

export default function Logout() {
    const { setToken } = useAuth();
    setToken();
};

