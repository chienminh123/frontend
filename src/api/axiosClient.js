import axios from "axios";

const axiosClient = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// 2. Interceptor: Tự động gắn Token vào mỗi lần gọi API
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token"); // Lấy token từ bộ nhớ trình duyệt
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosClient;
