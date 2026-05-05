import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import toast, { Toaster } from "react-hot-toast";

const ClientAuth = () => {
  const [activeTab, setActiveTab] = useState("login");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Login states
  const [loginData, setLoginData] = useState({
    TenTaiKhoan: "",
    MatKhau: "",
  });

  // Register states
  const [registerData, setRegisterData] = useState({
    Email: "",
    HoTen: "",
    sdt: "",
    MatKhau: "",
    NgaySinh: "",
  });

  const handleLoginChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  const handleRegisterChange = (e) => {
    setRegisterData({ ...registerData, [e.target.name]: e.target.value });
  };

  const handleSendOtp = async () => {
    // Kiểm tra tất cả fields đã nhập
    if (
      !registerData.Email ||
      !registerData.HoTen ||
      !registerData.sdt ||
      !registerData.MatKhau ||
      !registerData.NgaySinh
    ) {
      toast.error("Vui lòng nhập đầy đủ thông tin!");
      return;
    }
    setLoading(true);
    try {
      const otpRequest = {
        Email: registerData.Email,
        HoTen: registerData.HoTen,
        sdt: registerData.sdt,
        MatKhau: registerData.MatKhau,
        NgaySinh: registerData.NgaySinh,
      };

      // Gửi toàn bộ dữ liệu đăng ký để backend xác thực trước khi gửi OTP
      const res = await axiosClient.post("/client/auth/send-otp", otpRequest);

      // Res có thể là string hoặc object
      const successMessage =
        typeof res.data === "string"
          ? res.data
          : res.data?.message || res.data?.Message || "Đã gửi OTP";
      toast.success(successMessage);

      localStorage.setItem("registerData", JSON.stringify(otpRequest));
      navigate("/otp-verification");
    } catch (err) {
      console.error("send-otp error", err);
      const response = err.response;
      const data = response?.data;
      let errorMessage = "Lỗi gửi OTP!";

      if (typeof data === "string") {
        errorMessage = data;
      } else if (data) {
        // ASP.NET model validation error format
        if (data.errors) {
          const firstError = Object.values(data.errors)[0];
          if (Array.isArray(firstError)) {
            errorMessage = firstError[0];
          }
        } else {
          errorMessage = data.message || data.Message || JSON.stringify(data);
        }
      }

      // Nếu vẫn không rõ thì show status + raw response (giúp debug)
      if (!errorMessage || errorMessage === "Lỗi gửi OTP!") {
        errorMessage = `Lỗi ${response?.status || "?"}: ${JSON.stringify(data)}`;
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axiosClient.post("/client/auth/login", loginData);
      localStorage.setItem("token", res.data.token);
      toast.success(res.data.Message);
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data || "Lỗi đăng nhập!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Toaster />
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="flex mb-6">
          <button
            className={`flex-1 py-2 px-4 text-center ${
              activeTab === "login"
                ? "bg-green-500 text-white"
                : "bg-gray-200 text-gray-700"
            } rounded-l-lg`}
            onClick={() => setActiveTab("login")}
          >
            Đăng nhập
          </button>
          <button
            className={`flex-1 py-2 px-4 text-center ${
              activeTab === "register"
                ? "bg-green-500 text-white"
                : "bg-gray-200 text-gray-700"
            } rounded-r-lg`}
            onClick={() => setActiveTab("register")}
          >
            Đăng ký
          </button>
        </div>

        {activeTab === "login" && (
          <form onSubmit={handleLogin} className="space-y-4">
            <h2 className="text-2xl font-bold text-center text-green-600">
              Đăng nhập Thành viên
            </h2>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email hoặc SĐT:
              </label>
              <input
                type="text"
                name="TenTaiKhoan"
                value={loginData.TenTaiKhoan}
                onChange={handleLoginChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Mật khẩu:
              </label>
              <input
                type="password"
                name="MatKhau"
                value={loginData.MatKhau}
                onChange={handleLoginChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
            >
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
          </form>
        )}

        {activeTab === "register" && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-center text-green-600">
              Đăng ký Thành viên
            </h2>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email:
              </label>
              <input
                type="email"
                name="Email"
                value={registerData.Email}
                onChange={handleRegisterChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Họ tên:
              </label>
              <input
                type="text"
                name="HoTen"
                value={registerData.HoTen}
                onChange={handleRegisterChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                SĐT:
              </label>
              <input
                type="text"
                name="sdt"
                value={registerData.sdt}
                onChange={handleRegisterChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Mật khẩu:
              </label>
              <input
                type="password"
                name="MatKhau"
                value={registerData.MatKhau}
                onChange={handleRegisterChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Ngày sinh:
              </label>
              <input
                type="date"
                name="NgaySinh"
                value={registerData.NgaySinh}
                onChange={handleRegisterChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={loading}
              className="w-full bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
            >
              {loading ? "Đang xử lý..." : "Đăng ký"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientAuth;
