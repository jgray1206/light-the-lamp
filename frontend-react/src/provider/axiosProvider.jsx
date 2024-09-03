import axios from "axios";

const AxiosInstance = axios.create({
    baseURL: process.env.REACT_APP_SERVER_URL,
    timeout: 10000
});
export default AxiosInstance;