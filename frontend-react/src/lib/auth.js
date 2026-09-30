import { useMemo } from "react";
import { createStore } from "./store";

const TOKEN_KEY = "token";
const authStore = createStore({ token: localStorage.getItem(TOKEN_KEY) });

export const getToken = () => authStore.get().token;

export function setToken(token) {
    if (token) {
        localStorage.setItem(TOKEN_KEY, token);
    } else {
        localStorage.removeItem(TOKEN_KEY);
    }
    authStore.set({ token: token || null });
}

function decodeJwt(token) {
    try {
        const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
        const json = decodeURIComponent(
            atob(base64)
                .split("")
                .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
                .join("")
        );
        return JSON.parse(json);
    } catch {
        return {};
    }
}

export function useAuth() {
    const { token } = authStore.useStore();
    return useMemo(() => {
        const claims = token ? decodeJwt(token) : {};
        return {
            token,
            userId: claims.id ?? -1,
            isAdmin: claims.roles?.includes("admin") ?? false,
        };
    }, [token]);
}
