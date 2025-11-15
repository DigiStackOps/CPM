import axios from 'axios';
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api';
const instance = axios.create({ baseURL: API_BASE, timeout: 5000 });
export default instance;