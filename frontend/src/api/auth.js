import axios from "axios";

export default axios.create({
    baseURL: process.env.AUTH_BASE_URL || "http://localhost:8000"
});