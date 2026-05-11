import React, { useEffect, useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useOutletContext,
  useNavigate,
} from "react-router-dom";
import { getCurrentUser } from "../utils/auth";
import axios from "axios";

// Khởi tạo axios để gọi API lấy thông tin user và upload ảnh
const api = axios.create({
  baseURL: "/api",
  headers: { Accept: "application/json" },
});

const getAdminToken = () =>
  window.localStorage.getItem("adminToken") ||
  window.localStorage.getItem("token") ||
  "";

api.interceptors.request.use((config) => {
  const token = getAdminToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const parseJwtPayload = (token) => {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    return JSON.parse(
      decodeURIComponent(
        atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
          .split("")
          .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
          .join(""),
      ),
    );
  } catch {
    return null;
  }
};

const baseMenu = [
  {
    path: "/admin/dashboard",
    label: "📊 Tổng quan",
    roles: [
      "Admin",
      "HR",
      "StoreManager",
      "AreaManager",
      "Accountant",
      "Production",
      "Attendance",
      "Sales",
      "IPOS",
    ],
  },
];

const roleMenus = [
  {
    path: "/admin/employees",
    label: "👩‍🍳 Nhân sự (HR)",
    roles: ["Admin", "HR"],
  },
  {
    path: "/admin/shops",
    label: "🏪 Vận hành kinh doanh",
    roles: ["Admin", "StoreManager", "AreaManager"],
  },
  {
    path: "/admin/accounting",
    label: "💰 Kế toán",
    roles: ["Admin", "Accountant"],
  },
  {
    path: "/admin/suppliers",
    label: "🏭 Sản xuất",
    roles: ["Admin", "Production"],
  },
  {
    path: "/admin/attendance",
    label: "⏰ Dữ liệu chấm công",
    roles: [
      "Admin",
      "HR",
      "StoreManager",
      "AreaManager",
      "Accountant",
      "Production",
      "Attendance",
    ],
  },
];

function getMenuForRole(role) {
  const all = [...baseMenu, ...roleMenus];
  return all.filter((item) => !item.roles || item.roles.includes(role));
}

const AdminLayout = () => {
  const outletContext = useOutletContext();
  const basicUser = outletContext?.user || getCurrentUser();
  const navigate = useNavigate();

  const role = basicUser?.role || "";
  const name = basicUser?.name || "";
  const menus = getMenuForRole(role);

  // States cho Profile & Modal
  const [currentUser, setCurrentUser] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Load thông tin chi tiết user (có avatar)
  const loadUser = async () => {
    const token = getAdminToken();
    const payload = token ? parseJwtPayload(token) : null;
    if (!payload) return;
    try {
      const res = await api.get("/admin/Employee");
      let empData = [];
      if (Array.isArray(res.data)) empData = res.data;
      else if (res.data && typeof res.data === "object")
        empData = res.data.data || res.data.employees || [];

      const loggedInId = payload.Id || payload.id;
      const me = empData.find(
        (e) => String(e.taiKhoanNoiBoId || e.id) === String(loggedInId),
      );
      if (me) {
        setCurrentUser(me);
      }
    } catch (e) {
      console.error("Lỗi tải thông tin user", e);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/admin/login", { replace: true });
  };

  // Helper: Xử lý avatar URL
  const getAvatarUrl = (avatar) => {
    if (!avatar) return null;
    if (avatar.startsWith("http") || avatar.startsWith("data:")) return avatar;
    if (avatar.startsWith("/")) return `http://localhost:5017${avatar}`;
    return avatar;
  };

  const handleUploadAvatar = async (e) => {
    e.preventDefault();
    if (!avatarFile) return;
    try {
      setAvatarUploading(true);
      const form = new FormData();
      form.append("AvatarUpload", avatarFile);
      await api.patch("/admin/Employee/update-avatar", form);

      await loadUser();

      setAvatarFile(null);
      setAvatarPreview(null);
      setShowProfileModal(false);
      alert("Cập nhật ảnh đại diện thành công!");
    } catch (err) {
      alert(
        "Lỗi khi tải ảnh lên: " + (err?.response?.data?.message || err.message),
      );
    } finally {
      setAvatarUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-green-50/50 font-sans flex text-gray-800">
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-green-100 flex flex-col shadow-sm z-20">
        <div className="px-6 py-5 border-b border-green-50 flex items-center justify-center">
          <Link
            to="/admin/dashboard"
            className="text-xl font-extrabold tracking-tight text-gray-800"
          >
            Cháo<span className="text-green-500">DinhDưỡng</span>
          </Link>
        </div>

        {/* PROFILE */}
        <div
          className="px-5 py-4 border-b border-green-50 bg-green-50/30 flex items-center gap-3 cursor-pointer hover:bg-green-100/50 transition group"
          onClick={() => setShowProfileModal(true)}
        >
          <div className="relative shrink-0">
            {currentUser?.avatar || currentUser?.avatarUrl ? (
              <img
                src={getAvatarUrl(currentUser.avatar || currentUser.avatarUrl)}
                alt="Avatar"
                className="h-10 w-10 rounded-full object-cover border-2 border-green-200"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-green-200 flex items-center justify-center text-sm font-bold text-green-700 border-2 border-green-100">
                {(currentUser?.tenNhanVien || name || "A")
                  .charAt(0)
                  .toUpperCase()}
              </div>
            )}
            <div className="absolute -bottom-0.5 -right-0.5 bg-yellow-400 w-4 h-4 rounded-full border border-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-[9px]">✏️</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-800 truncate">
              {currentUser?.tenNhanVien || name || "Đang tải..."}
            </p>
            <p className="text-[11px] font-semibold text-green-600 bg-green-100 inline-block px-1.5 py-0.5 rounded mt-0.5 truncate">
              {currentUser?.chucVu?.chucVuName || role}
            </p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-5 space-y-1.5 scrollbar-hide">
          {menus.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                [
                  "flex items-center px-4 py-2.5 rounded-xl text-sm font-semibold transition-all",
                  isActive
                    ? "bg-green-500 text-white shadow-md shadow-green-500/20 transform -translate-y-0.5"
                    : "text-gray-600 hover:bg-green-50 hover:text-green-600",
                ].join(" ")
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-5 py-5 border-t border-green-50">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 text-sm font-bold px-4 py-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 transition"
          >
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-green-100 px-8 flex items-center justify-between bg-white/70 backdrop-blur sticky top-0 z-10">
          <h1 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
            Hệ thống quản trị trung tâm
          </h1>
        </header>
        <div className="flex-1 p-6 lg:p-8 overflow-auto">
          {/* Nơi render các Page con (ShopPage, EmployeePage...) */}
          <Outlet context={{ user: basicUser, currentUser }} />
        </div>
      </main>

      {/* MODAL HỒ SƠ + ĐỔI AVATAR */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl relative border border-green-50">
            <button
              onClick={() => {
                setShowProfileModal(false);
                setAvatarPreview(null);
                setAvatarFile(null);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 w-8 h-8 rounded-full font-bold transition"
            >
              ✕
            </button>
            <h3 className="text-xl font-extrabold text-center text-gray-800 mb-6">
              Hồ sơ của tôi
            </h3>

            <form
              onSubmit={handleUploadAvatar}
              className="flex flex-col items-center mb-6"
            >
              <div className="relative mb-4 group cursor-pointer">
                {avatarPreview ||
                currentUser?.avatar ||
                currentUser?.avatarUrl ? (
                  <img
                    src={
                      avatarPreview ||
                      getAvatarUrl(
                        currentUser?.avatar || currentUser?.avatarUrl,
                      )
                    }
                    alt="avatar"
                    className="h-32 w-32 rounded-full object-cover border-4 border-green-100 shadow-md group-hover:opacity-70 transition"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="h-32 w-32 rounded-full bg-green-100 flex items-center justify-center text-4xl font-bold text-green-600 shadow-md group-hover:opacity-70 transition">
                    {(currentUser?.tenNhanVien || name || "A")
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition pointer-events-none bg-black/20 rounded-full">
                  <span className="text-white text-2xl drop-shadow-md">📷</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full rounded-full"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    setAvatarFile(f);
                    if (f) setAvatarPreview(URL.createObjectURL(f));
                  }}
                />
              </div>

              {avatarFile && (
                <button
                  type="submit"
                  disabled={avatarUploading}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2.5 rounded-xl transition shadow-md shadow-green-500/30"
                >
                  {avatarUploading ? "Đang tải lên..." : "Lưu ảnh đại diện"}
                </button>
              )}
            </form>

            <div className="space-y-3 text-sm bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <span className="text-gray-500 font-medium">Họ tên:</span>
                <span className="font-bold text-gray-800">
                  {currentUser?.tenNhanVien || name}
                </span>
              </div>
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <span className="text-gray-500 font-medium">Tài khoản:</span>
                <span className="font-bold text-gray-800">
                  {currentUser?.tenTaiKhoan || "N/A"}
                </span>
              </div>
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <span className="text-gray-500 font-medium">SĐT:</span>
                <span className="font-bold text-gray-800">
                  {currentUser?.sdt || "Chưa cập nhật"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Cửa hàng:</span>
                <span className="font-bold text-green-600">
                  {currentUser?.cuaHang?.shopName || "Tổng công ty"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLayout;
