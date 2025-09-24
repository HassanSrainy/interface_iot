import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000/api", // backend Laravel
  withCredentials: true,               // pour envoyer laravel_session / XSRF-TOKEN
  headers: { Accept: "application/json" },
});

export default api;
