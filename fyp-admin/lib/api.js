// lib/api.js
import axios from "axios";

const base = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export const api = axios.create({
  baseURL: base,
});
