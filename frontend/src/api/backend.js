import axios from "axios";

export default axios.create({
    baseURL: process.env.BACKEND_BASE_URL || "http://localhost:3000"
});