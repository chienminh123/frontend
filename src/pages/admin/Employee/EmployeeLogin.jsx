import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axiosClient from "../../../api/axiosClient"; // Dùng lại axiosClient đã cấu hình của bạn

const EmployeeLogin = () => {
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      // Gọi chung API Login mà Admin đang dùng (bạn nhớ đổi URL nếu API của bạn tên khác nhé)
      const res = await axiosClient.post("/admin/Auth/login", {
        tenTaiKhoan: credentials.username,
        matKhau: credentials.password,
      });

      // Giả sử Backend trả về token
      const { token, user } = res.data;

      // Lưu Token vào localStorage để lát nữa gửi kèm lúc chấm công
      localStorage.setItem("token", token);

      // Nếu API có trả về thông tin user thì lưu luôn, hoặc parse từ JWT Token
      if (user) {
        localStorage.setItem("employeeInfo", JSON.stringify(user));
      }

      toast.success("Đăng nhập thành công!");

      // Chuyển hướng thẳng sang trang quét QR chấm công
      navigate("/check-in");
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Sai tài khoản hoặc mật khẩu!",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-green-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-8 border-t-4 border-green-500">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-gray-800 tracking-tight">
            Cháo<span className="text-green-500">DinhDưỡng</span>
          </h1>
          <p className="text-sm text-gray-500 mt-2 font-medium">
            Cổng thông tin dành cho Nhân viên
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
              Tài khoản (Mã NV)
            </label>
            <input
              type="text"
              required
              className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
              placeholder="Nhập tên tài khoản..."
              value={credentials.username}
              onChange={(e) =>
                setCredentials({ ...credentials, username: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
              Mật khẩu
            </label>
            <input
              type="password"
              required
              className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
              placeholder="••••••••"
              value={credentials.password}
              onChange={(e) =>
                setCredentials({ ...credentials, password: e.target.value })
              }
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold text-sm py-3.5 rounded-xl shadow-lg shadow-green-500/30 transition-all disabled:opacity-70 mt-4"
          >
            {loading ? "Đang xác thực..." : "Đăng nhập để Chấm công"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EmployeeLogin;
