import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import { decodeJwt } from "../../utils/auth";

const AdminLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await axiosClient.post("/admin/auth/login", {
        TenTaiKhoan: username,
        MatKhau: password,
      });

      const { token, message } = res.data;

      if (!token) {
        setErrorMsg("Đăng nhập thất bại: Không nhận được token từ server.");
        return;
      }

      const info = decodeJwt(token);
      const role = info.role; // ví dụ: "Admin", "HR", "Accountant", ...

      // Nếu có role không được phép dùng web admin thì chặn ở đây (tùy bạn)
      if (role === "POS") {
        setErrorMsg("Tài khoản này chỉ được dùng trên máy IPOS.");
        return;
      }

      localStorage.setItem("token", token);
      localStorage.setItem("adminToken", token);
      alert(message || "Đăng nhập thành công!");
      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      const msg =
        err?.response?.data ||
        err?.response?.data?.message ||
        "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.";
      setErrorMsg(typeof msg === "string" ? msg : "Đăng nhập thất bại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center px-4 relative overflow-hidden font-sans">
      {/* Các luồng sáng nền trang trí (Xanh lá & Vàng) */}
      <div className="pointer-events-none absolute -top-32 -right-40 h-96 w-96 rounded-full bg-green-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-40 h-96 w-96 rounded-full bg-yellow-400/20 blur-3xl" />

      <div className="relative max-w-5xl w-full grid md:grid-cols-2 gap-10 items-center z-10">
        {/* Khối trái: giới thiệu hệ thống */}
        <div className="hidden md:block">
          <div className="mb-6">
            <p className="text-sm font-bold tracking-wider text-green-600 mb-3 uppercase">
              Hệ Thống Quản Trị
            </p>
            <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-800 leading-tight">
              Dinh dưỡng <br />
              <span className="text-green-600">tận tâm,</span> <br />
              <span className="text-yellow-500">quản lý dễ dàng.</span>
            </h1>
          </div>
          <p className="text-base text-gray-600 mb-8 max-w-md">
            Nền tảng quản lý cửa hàng, nhân sự và doanh thu chuỗi cháo dinh
            dưỡng thân thiện, an toàn và trực quan.
          </p>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="rounded-2xl border border-green-100 bg-white/60 backdrop-blur-sm p-5 shadow-sm transition hover:shadow-md">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mb-3">
                <span className="text-green-600 text-xl">🌱</span>
              </div>
              <p className="font-bold text-gray-800 mb-1">Trực quan</p>
              <p className="text-sm text-gray-600">
                Theo dõi doanh thu và hoạt động cửa hàng dễ dàng.
              </p>
            </div>
            <div className="rounded-2xl border border-yellow-100 bg-white/60 backdrop-blur-sm p-5 shadow-sm transition hover:shadow-md">
              <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center mb-3">
                <span className="text-yellow-600 text-xl">🛡️</span>
              </div>
              <p className="font-bold text-gray-800 mb-1">Bảo mật</p>
              <p className="text-sm text-gray-600">
                Phân quyền an toàn, bảo vệ dữ liệu toàn hệ thống.
              </p>
            </div>
          </div>
        </div>

        {/* Khối phải: form login */}
        <div className="bg-white rounded-[2rem] p-8 md:p-10 shadow-2xl shadow-green-900/5 border border-green-50">
          <div className="mb-8 text-center md:text-left">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
              Đăng nhập
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Vui lòng điền thông tin để truy cập hệ thống quản trị.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 font-medium flex items-center gap-2">
              <span className="text-red-500">⚠️</span> {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Tên tài khoản
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl bg-gray-50 border border-gray-200 text-gray-800 px-4 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors placeholder:text-gray-400"
                placeholder="Nhập tên tài khoản..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Mật khẩu
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl bg-gray-50 border border-gray-200 text-gray-800 px-4 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors placeholder:text-gray-400"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 inline-flex items-center justify-center rounded-xl bg-green-500 px-4 py-3.5 text-base font-bold text-white shadow-lg shadow-green-500/30 hover:bg-green-600 focus:ring-4 focus:ring-green-500/20 disabled:opacity-60 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5"
            >
              {loading ? "Đang xử lý..." : "Đăng nhập hệ thống"}
            </button>
          </form>

          <p className="mt-8 text-sm text-gray-400 text-center">
            Quên mật khẩu? Vui lòng liên hệ{" "}
            <span className="text-green-600 font-semibold cursor-pointer hover:underline">
              Quản trị viên
            </span>{" "}
            để được hỗ trợ.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
