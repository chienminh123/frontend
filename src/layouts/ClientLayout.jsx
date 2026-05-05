import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Outlet,
  Link,
  NavLink,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { getCurrentClientUser } from "../utils/auth";
import clientAccountApi from "../api/clientAccountApi";
import axiosClient from "../api/axiosClient";

const ClientLayout = () => {
  const navItemClass = ({ isActive }) =>
    [
      "text-sm font-black uppercase tracking-wide transition",
      isActive ? "text-green-700" : "text-gray-600 hover:text-green-600",
    ].join(" ");

  const location = useLocation();
  const navigate = useNavigate();

  const [session, setSession] = useState(() => getCurrentClientUser());
  const [profile, setProfile] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const [cartCount, setCartCount] = useState(0);

  const displayName = useMemo(() => {
    const name =
      profile?.tenKhachHang ||
      session?.raw?.tenKhachHang ||
      session?.name ||
      "";
    return String(name || "").trim() || "Tài khoản";
  }, [profile, session]);

  const points = useMemo(() => {
    const p = profile?.tichDiem;
    if (typeof p === "number") return p;
    const fromRaw = session?.raw?.tichDiem;
    return typeof fromRaw === "number" ? fromRaw : 0;
  }, [profile, session]);

  useEffect(() => {
    // cập nhật session khi route đổi (sau login navigate "/")
    setSession(getCurrentClientUser());
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    let alive = true;
    const loadMe = async () => {
      if (!session?.token) {
        setProfile(null);
        return;
      }
      try {
        const me = await clientAccountApi.me();
        if (!alive) return;
        setProfile(me);
      } catch {
        if (!alive) return;
        // nếu API chưa chạy/401, vẫn fallback qua info trong token
        setProfile(null);
      }
    };
    loadMe();
    return () => {
      alive = false;
    };
  }, [session?.token]);

  useEffect(() => {
    let alive = true;

    // 1. Hàm gọi API lấy tổng số lượng từ Server
    const fetchCartCount = async () => {
      if (!session?.token) {
        setCartCount(0);
        return;
      }
      try {
        const res = await axiosClient.get("/client/cart/count", {
          headers: { Authorization: `Bearer ${session.token}` },
        });
        if (alive) {
          setCartCount(res.data || 0); // Nhận trực tiếp số từ API
        }
      } catch (err) {
        console.error("Lỗi lấy số lượng giỏ hàng:", err);
      }
    };

    // Gọi lần đầu khi user vừa vào web hoặc F5
    fetchCartCount();

    // 2. Lắng nghe event khi user thao tác
    const handleCartUpdate = (e) => {
      const { action, qty } = e.detail || {};

      if (action === "clear") {
        setCartCount(0); // Thanh toán xong -> Về 0
      } else if (action === "reload") {
        fetchCartCount();
      } else {
        const qtyAdded = qty !== undefined ? qty : 1;
        setCartCount((prev) => {
          const newCount = prev + qtyAdded;
          return newCount > 0 ? newCount : 0;
        });
      }
    };

    window.addEventListener("cartUpdated", handleCartUpdate);
    return () => {
      alive = false;
      window.removeEventListener("cartUpdated", handleCartUpdate);
    };
  }, [session?.token]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("adminToken");
    setProfile(null);
    setSession(null);
    setMenuOpen(false);
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 flex flex-col">
      {/* Header cho khách hàng */}
      <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-md border-b border-green-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-[72px] flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl text-green-600">🥣</span>
            <h1 className="text-xl font-black tracking-tight text-gray-800 uppercase">
              DinhDưỡng<span className="text-green-500">.Food</span>
            </h1>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <NavLink to="/" className={navItemClass} end>
              Trang chủ
            </NavLink>
            <NavLink to="/menu" className={navItemClass}>
              Sản phẩm
            </NavLink>
            <NavLink to="/about" className={navItemClass}>
              Về chúng tôi
            </NavLink>
            <NavLink to="/contact" className={navItemClass}>
              Liên hệ
            </NavLink>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-4">
            {!session?.token ? (
              <Link
                to="/login"
                className="text-sm font-black text-gray-600 hover:text-green-600 transition"
              >
                Đăng nhập
              </Link>
            ) : (
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-green-50 transition"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                >
                  <div className="w-9 h-9 rounded-full bg-green-100 border border-green-200 flex items-center justify-center font-black text-green-700">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-sm font-black text-gray-800 leading-tight max-w-[140px] truncate">
                      {displayName}
                    </div>
                    <div className="text-[11px] font-bold text-green-700 leading-tight">
                      {Number(points || 0).toLocaleString("vi-VN")} điểm
                    </div>
                  </div>
                  <span className="text-gray-400 font-black">▾</span>
                </button>

                {menuOpen && (
                  <div
                    className="absolute right-0 mt-2 w-72 bg-white border border-gray-100 rounded-3xl shadow-2xl shadow-black/10 overflow-hidden"
                    role="menu"
                  >
                    <div className="p-4 bg-green-50/60 border-b border-green-100">
                      <p className="text-xs font-black uppercase tracking-widest text-green-700">
                        Tài khoản
                      </p>
                      <p className="text-lg font-black text-gray-900 mt-1 truncate">
                        {displayName}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Điểm tích lũy:{" "}
                        <span className="font-black text-green-700">
                          {Number(points || 0).toLocaleString("vi-VN")}
                        </span>
                      </p>
                    </div>

                    <div className="p-2">
                      <Link
                        to="/account"
                        className="flex items-center justify-between px-4 py-3 rounded-2xl hover:bg-gray-50 transition font-black text-sm text-gray-800"
                        role="menuitem"
                        onClick={() => setMenuOpen(false)}
                      >
                        <span>Thông tin cá nhân</span>
                        <span className="text-gray-300">→</span>
                      </Link>
                      <Link
                        to="/account/points"
                        className="flex items-center justify-between px-4 py-3 rounded-2xl hover:bg-gray-50 transition font-black text-sm text-gray-800"
                        role="menuitem"
                        onClick={() => setMenuOpen(false)}
                      >
                        <span>Điểm đã tích</span>
                        <span className="text-gray-300">→</span>
                      </Link>
                      <Link
                        to="/account/my-orders"
                        className="flex items-center justify-between px-4 py-3 rounded-2xl hover:bg-gray-50 transition font-black text-sm text-gray-800"
                        role="menuitem"
                        onClick={() => setMenuOpen(false)}
                      >
                        <span>Lịch sử đặt hàng</span>
                        <span className="text-gray-300">→</span>
                      </Link>
                    </div>

                    <div className="p-2 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-2xl hover:bg-red-50 transition font-black text-sm text-red-600"
                        role="menuitem"
                      >
                        <span>Đăng xuất</span>
                        <span className="text-red-300">⎋</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            <Link
              to="/cart"
              className="bg-yellow-400 hover:bg-yellow-500 text-yellow-900 px-5 py-2.5 rounded-full font-black text-sm shadow-md shadow-yellow-400/20 transition transform hover:-translate-y-0.5 active:scale-95"
            >
              Giỏ hàng ({cartCount})
            </Link>
          </div>
        </div>
      </header>

      {/* Nội dung trang chủ/sản phẩm */}
      <main className="flex-1 w-full">
        <div className="w-full">
          <Outlet />
        </div>
      </main>

      {/* Footer chuyên nghiệp */}
      <footer className="bg-white border-t border-green-100 pt-12 pb-6">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-1">
            <h2 className="text-lg font-black text-green-600 mb-4 uppercase">
              DinhDưỡng.Food
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              Mang đến những bữa ăn dồi dào dưỡng chất, an toàn và tinh tế cho
              sức khỏe gia đình bạn mỗi ngày.
            </p>
          </div>
          <div>
            <h3 className="font-bold mb-4">Liên kết</h3>
            <ul className="text-sm text-gray-500 space-y-2">
              <li>Chính sách bảo mật</li>
              <li>Điều khoản dịch vụ</li>
              <li>Hướng dẫn đặt hàng</li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-4">Liên hệ</h3>
            <ul className="text-sm text-gray-500 space-y-2">
              <li>Hotline: 1900 xxxx</li>
              <li>Email: contact@food.com</li>
              <li>Địa chỉ: Hoàng Mai, Hà Nội</li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-4">Bản tin</h3>
            <p className="text-xs text-gray-400 mb-3">
              Đăng ký để nhận ưu đãi mới nhất.
            </p>
            <div className="flex gap-1">
              <input
                type="email"
                placeholder="Email của bạn"
                className="bg-gray-100 border-none rounded-lg px-3 py-2 text-xs flex-1 outline-none focus:ring-1 focus:ring-green-500"
              />
              <button className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-xs font-black transition">
                Gửi
              </button>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 mt-12 pt-6 border-t border-gray-100 text-center text-xs text-gray-400">
          <p>© 2026 Food System. Tất cả các quyền được bảo lưu.</p>
        </div>
      </footer>
    </div>
  );
};

export default ClientLayout;
