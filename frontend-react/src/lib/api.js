import axios from "axios";
import Swal from "sweetalert2";
import { getToken, setToken } from "./auth";

const api = axios.create({
    baseURL: import.meta.env.BASE_URL,
    timeout: 10000,
    // Encode spaces as %20 rather than "+" (e.g. player names in ?pick=)
    paramsSerializer: { encode: encodeURIComponent },
});

api.interceptors.request.use((config) => {
    const token = getToken();
    if (token) {
        config.headers.Authorization = "Bearer " + token;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        // An expired/invalid token: log out. (A 401 without a token is just a bad login.)
        if (error.response?.status === 401 && error.config?.headers?.Authorization) {
            setToken(null);
            window.location.assign("/login");
        }
        return Promise.reject(error);
    }
);

export default api;

export function errorMessage(err) {
    const data = err?.response?.data;
    const message = data?._embedded?.errors?.[0]?.message || data?.message || err?.message || "Something went wrong.";
    // The server's rule checks surface as 500s prefixed with this; the rest is the useful part
    return message.replace(/^Internal Server Error: /, "");
}

// SweetAlert popups styled to match the app and its light/dark theme
export const alert = (options) =>
    Swal.fire({
        theme: document.documentElement.getAttribute("data-bs-theme") === "dark" ? "dark" : "light",
        confirmButtonColor: "#8c6a45",
        ...options,
    });

export const showError = (err) => alert({ text: errorMessage(err), icon: "error" });

export const showSuccess = (text) => alert({ text, icon: "success" });

export const confirm = (text, { confirmButtonText = "OK", cancelButtonText = "Cancel", icon = "warning" } = {}) =>
    alert({ text, icon, showCancelButton: true, confirmButtonText, cancelButtonText })
        .then((result) => result.isConfirmed);

export async function getProfilePic(userId) {
    try {
        const { data } = await api.get(`/api/user/${userId}/pic`);
        return "data:image/png;base64," + data;
    } catch {
        return "/shrug.png";
    }
}
