import axios from "axios";

const AxiosInstance = axios.create({
    baseURL: "https://lightthelamp.dev",
    timeout: 10000
});
export default AxiosInstance;