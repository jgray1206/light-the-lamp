import axios from "axios";

const AxiosInstance = axios.create({
    baseURL: import.meta.env.BASE_URL,
    timeout: 10000
});
export default AxiosInstance;