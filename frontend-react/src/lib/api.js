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

export const NO_PIC = "/shrug.png";

// Pics are stored as raw image bytes and served as base64. Label the data URL with the real
// format (uploads are JPEGs, older ones may be PNGs) and treat an empty pic as "no pic".
export function picDataUrl(base64) {
    if (!base64) return NO_PIC;
    const type = base64.startsWith("/9j/") ? "jpeg"
        : base64.startsWith("R0lGOD") ? "gif"
        : base64.startsWith("UklGR") ? "webp"
        : "png";
    return `data:image/${type};base64,${base64}`;
}

export async function getProfilePic(userId) {
    try {
        const { data } = await api.get(`/api/user/${userId}/pic`);
        return picDataUrl(typeof data === "string" ? data.trim() : "");
    } catch {
        return NO_PIC;
    }
}

// onError handler for avatar <img>s: fall back to the shrug instead of a broken-image icon
export const fallbackToNoPic = ({ currentTarget }) => {
    currentTarget.onerror = null;
    currentTarget.src = NO_PIC;
};
