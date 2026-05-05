import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import productApi from "../../api/productApi";
import { getCurrentClientUser } from "../../utils/auth";

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState("");

  const isAuthenticated = Boolean(getCurrentClientUser()?.token);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        setLoadingProducts(true);
        setProductsError("");
        // Đảm bảo productApi.getAll() đang trỏ tới API gộp nhóm mới viết nhé
        const list = await productApi.getMenuClient();
        if (!alive) return;
        setProducts(list);
      } catch (e) {
        if (!alive) return;
        setProductsError(
          e?.response?.data?.message ||
            e?.message ||
            "Không thể tải danh sách sản phẩm.",
        );
      } finally {
        if (!alive) return;
        setLoadingProducts(false);
      }
    };
    load();
    return () => {
      alive = false;
    };
  }, []);

  const featuredSoups = useMemo(() => products.slice(0, 4), [products]);

  const categories = useMemo(
    () => [
      {
        key: "me-be",
        title: "Mẹ & Bé",
        desc: "Công thức mềm, dễ tiêu hoá, tối ưu dinh dưỡng.",
        icon: "👶",
        to: "/menu",
        badge: "Bán chạy",
      },
      {
        key: "gia-dinh",
        title: "Gia đình",
        desc: "Bữa sáng gọn nhẹ, đủ chất cho cả nhà.",
        icon: "👨‍👩‍👧‍👦",
        to: "/menu",
        badge: "Tiện lợi",
      },
      {
        key: "eat-clean",
        title: "Eat Clean",
        desc: "Ưu tiên ít dầu, nhiều rau củ, vị thanh.",
        icon: "🥦",
        to: "/menu",
        badge: "Healthy",
      },
      {
        key: "tang-can",
        title: "Tăng đề kháng",
        desc: "Nguyên liệu sạch, hầm kỹ, vị ngọt tự nhiên.",
        icon: "🛡️",
        to: "/menu",
        badge: "Dinh dưỡng",
      },
    ],
    [],
  );

  const steps = useMemo(
    () => [
      {
        title: "Chọn món",
        desc: "Lọc theo loại và giá trong thực đơn.",
        icon: "🧾",
      },
      {
        title: "Đặt hàng",
        desc: "Thêm vào giỏ, xác nhận thông tin giao nhận.",
        icon: "🛒",
      },
      {
        title: "Nhận nóng hổi",
        desc: "Đóng gói giữ ấm, giao nhanh trong ngày.",
        icon: "⚡",
      },
    ],
    [],
  );

  const testimonials = useMemo(
    () => [
      {
        name: "Chị Minh Anh",
        meta: "Mẹ bé 2 tuổi",
        quote:
          "Bé nhà mình ăn ngon miệng hơn hẳn. Món vị thanh, không bị mặn, rất yên tâm.",
        rating: 5,
      },
      {
        name: "Anh Hoàng",
        meta: "Nhân viên văn phòng",
        quote:
          "Sáng bận mà vẫn có bữa đủ chất. Giao nhanh, cháo còn ấm, cực kỳ tiện.",
        rating: 5,
      },
      {
        name: "Cô Lan",
        meta: "Gia đình 4 người",
        quote:
          "Nguyên liệu tươi, ăn cảm nhận rõ vị tự nhiên. Nhà mình đặt đều mỗi tuần.",
        rating: 5,
      },
    ],
    [],
  );

  const faqs = useMemo(
    () => [
      {
        q: "Cháo có chất bảo quản không?",
        a: "Không. Bên mình ưu tiên nấu trong ngày, đóng gói giữ ấm và giao nhanh.",
      },
      {
        q: "Có phù hợp cho bé nhỏ không?",
        a: "Có. Các món dành cho bé được nấu mềm, vị nhạt, dễ tiêu hoá (tuỳ giai đoạn).",
      },
      {
        q: "Mình có thể đặt trước không?",
        a: "Có. Bạn có thể đặt trước để bên mình chuẩn bị đúng khung giờ giao mong muốn.",
      },
    ],
    [],
  );

  const formatVnd = (value) => `${Number(value || 0).toLocaleString("vi-VN")}₫`;

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="bg-green-500 py-20 px-4 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-green-400/30 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-400/20 rounded-full blur-2xl -ml-20 -mb-20"></div>

        <div className="max-w-7xl mx-auto grid md:grid-cols-2 items-center gap-12 relative z-10">
          <div className="text-white space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-yellow-400 text-yellow-900 px-4 py-1.5 rounded-full font-bold text-xs uppercase tracking-widest shadow-lg">
                Món mới mỗi ngày
              </span>
              <span className="bg-white/15 border border-white/20 text-white px-4 py-1.5 rounded-full font-bold text-xs uppercase tracking-widest">
                Tươi sạch • Nấu trong ngày
              </span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black leading-tight">
              Dinh dưỡng trọn vẹn <br />
              <span className="text-yellow-300">Cho bé yêu & Gia đình</span>
            </h2>
            <p className="text-green-50 text-lg max-w-md">
              Nguyên liệu tươi sạch 100% từ nông trại trực tiếp đến bàn ăn,
              không chất bảo quản.
            </p>
            <div className="flex gap-4 pt-4">
              <Link
                to="/menu"
                className="bg-white text-green-700 px-8 py-3 rounded-full font-black shadow-xl hover:bg-green-50 transition active:scale-95"
              >
                Xem Thực Đơn
              </Link>
              {!isAuthenticated ? (
                <Link
                  to="/login"
                  className="border-2 border-white/50 text-white px-8 py-3 rounded-full font-black hover:bg-white/10 transition active:scale-95"
                >
                  Đăng nhập để đặt nhanh
                </Link>
              ) : (
                <Link
                  to="/account/orders"
                  className="border-2 border-white/50 text-white px-8 py-3 rounded-full font-black hover:bg-white/10 transition active:scale-95"
                >
                  Quản lý đơn hàng
                </Link>
              )}
            </div>
            <div className="grid grid-cols-3 gap-4 pt-6 max-w-lg">
              <div className="bg-white/10 border border-white/15 rounded-2xl p-4">
                <p className="text-2xl font-black leading-none">30’</p>
                <p className="text-xs text-green-50/90 font-bold uppercase tracking-widest mt-1">
                  Chuẩn bị
                </p>
              </div>
              <div className="bg-white/10 border border-white/15 rounded-2xl p-4">
                <p className="text-2xl font-black leading-none">100%</p>
                <p className="text-xs text-green-50/90 font-bold uppercase tracking-widest mt-1">
                  Tươi sạch
                </p>
              </div>
              <div className="bg-white/10 border border-white/15 rounded-2xl p-4">
                <p className="text-2xl font-black leading-none">0</p>
                <p className="text-xs text-green-50/90 font-bold uppercase tracking-widest mt-1">
                  Bảo quản
                </p>
              </div>
            </div>
          </div>
          <div className="hidden md:flex justify-center relative">
            <div className="w-[450px] h-[450px] bg-white/20 rounded-full flex items-center justify-center border-2 border-white/30">
              <div className="w-[380px] h-[380px] bg-white rounded-full shadow-2xl flex items-center justify-center text-8xl">
                🥣
              </div>
            </div>
            <div className="absolute top-10 right-0 bg-white p-4 rounded-2xl shadow-xl animate-bounce duration-[3000ms]">
              <p className="text-xs text-gray-400 font-bold uppercase">
                Sạch 100%
              </p>
              <p className="text-lg font-black text-green-600">Organic 🌱</p>
            </div>
            <div className="absolute bottom-10 left-0 bg-white p-4 rounded-2xl shadow-xl">
              <p className="text-xs text-gray-400 font-bold uppercase">
                Giao nhanh
              </p>
              <p className="text-lg font-black text-yellow-500">Giữ ấm ♨️</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
          <div>
            <h3 className="text-3xl font-black text-gray-800">
              Danh mục gợi ý
            </h3>
            <p className="text-gray-500 mt-2">
              Chọn nhanh theo nhu cầu: bé nhỏ, gia đình, eat clean, tăng đề
              kháng.
            </p>
          </div>
          <Link
            to="/menu"
            className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-green-500 text-white font-black shadow-md shadow-green-500/20 hover:bg-green-600 transition"
          >
            Khám phá thực đơn
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((c) => (
            <Link
              key={c.key}
              to={c.to}
              className="group bg-white rounded-[2rem] border border-green-50 p-6 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="flex items-start justify-between">
                <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center text-2xl">
                  {c.icon}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                  {c.badge}
                </span>
              </div>
              <h4 className="mt-5 text-lg font-black text-gray-800 group-hover:text-green-600 transition-colors">
                {c.title}
              </h4>
              <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                {c.desc}
              </p>
              <div className="mt-5 text-sm font-black text-green-600">
                Xem món phù hợp →
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-black text-gray-800">
            Món Cháo Nổi Bật
          </h3>
          <p className="text-gray-500 mt-2">
            Lựa chọn hàng đầu của các bà mẹ thông thái
          </p>
        </div>

        {loadingProducts && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="bg-white rounded-[2rem] border border-green-50 p-4 shadow-sm"
              >
                <div className="aspect-square bg-gray-100 rounded-3xl mb-4 animate-pulse" />
                <div className="px-2 space-y-3">
                  <div className="h-3 w-20 bg-green-50 rounded animate-pulse" />
                  <div className="h-5 w-40 bg-gray-100 rounded animate-pulse" />
                  <div className="h-5 w-28 bg-gray-100 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loadingProducts && productsError && (
          <div className="bg-white border border-red-100 rounded-3xl p-6 text-center">
            <p className="text-sm font-bold text-red-600">{productsError}</p>
            <p className="text-xs text-gray-400 mt-2">
              Kiểm tra backend đang chạy và endpoint GET
              /api/client/menu/get-all
            </p>
          </div>
        )}

        {!loadingProducts && !productsError && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredSoups.map((p, idx) => (
              <div
                key={idx}
                className="group bg-white rounded-[2rem] border border-green-50 p-4 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
              >
                <div className="aspect-square bg-gray-100 rounded-3xl mb-4 overflow-hidden relative">
                  {p.hinhAnh ? (
                    <img
                      src={p.hinhAnh}
                      alt={p.sanPhamName}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src =
                          "https://via.placeholder.com/560x560?text=No+Image";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl">
                      🥣
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition" />
                </div>
                <div className="px-2 space-y-2">
                  <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">
                    {p.tenTheLoai || "Sản phẩm"}
                  </span>
                  <h4 className="font-black text-gray-800 text-lg leading-tight line-clamp-2">
                    {p.sanPhamName}
                  </h4>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-green-600 font-black text-xl">
                      <span className="text-sm text-gray-400 italic font-normal">
                        Từ{" "}
                      </span>
                      {formatVnd(p.giaBanTu)}
                    </span>
                    <Link
                      to={`/product/${encodeURIComponent(p.sanPhamName)}`}
                      className="bg-yellow-400 hover:bg-yellow-500 text-yellow-900 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-400/20 transition-all active:scale-90"
                    >
                      <span className="text-2xl font-bold">+</span>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-12 flex justify-center">
          <Link
            to="/menu"
            className="px-8 py-3 rounded-full bg-gray-900 text-white font-black hover:bg-black transition shadow-lg shadow-black/10"
          >
            Xem toàn bộ thực đơn
          </Link>
        </div>
      </section>

      {/* Why Choose Us & How it works & Testimonials & FAQ (Giữ nguyên y hệt) */}
      <section className="bg-white py-20 border-y border-green-50">
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-3 gap-12">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto text-3xl mb-4">
              🥦
            </div>
            <h5 className="font-black text-lg">Nguyên liệu tươi</h5>
            <p className="text-sm text-gray-500">
              Chỉ sử dụng thực phẩm tươi mới nhập từ các nông trại sạch trong
              ngày.
            </p>
          </div>
          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center mx-auto text-3xl mb-4">
              👩‍🍳
            </div>
            <h5 className="font-black text-lg">Đầu bếp tận tâm</h5>
            <p className="text-sm text-gray-500">
              Công thức nấu gia truyền, giữ trọn vẹn hương vị và vitamin tự
              nhiên.
            </p>
          </div>
          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto text-3xl mb-4">
              ⚡
            </div>
            <h5 className="font-black text-lg">Giao hàng tốc độ</h5>
            <p className="text-sm text-gray-500">
              Cháo luôn được giữ ấm trong quá trình vận chuyển đến tay bạn.
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-10 items-start">
          <div>
            <h3 className="text-3xl font-black text-gray-800">
              Đặt món nhanh trong 3 bước
            </h3>
            <p className="text-gray-500 mt-2 max-w-xl">
              Trải nghiệm đặt món đơn giản, ưu tiên tốc độ và độ an toàn thực
              phẩm.
            </p>
            <div className="mt-8 space-y-4">
              {steps.map((s) => (
                <div
                  key={s.title}
                  className="bg-white rounded-3xl border border-green-50 p-5 shadow-sm flex gap-4"
                >
                  <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-xl shrink-0">
                    {s.icon}
                  </div>
                  <div>
                    <p className="font-black text-gray-800">{s.title}</p>
                    <p className="text-sm text-gray-500 mt-1">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/menu"
                className="px-7 py-3 rounded-full bg-green-500 text-white font-black hover:bg-green-600 transition shadow-md shadow-green-500/20"
              >
                Bắt đầu chọn món
              </Link>
              {!isAuthenticated ? (
                <Link
                  to="/login"
                  className="px-7 py-3 rounded-full bg-white border border-gray-200 text-gray-800 font-black hover:bg-gray-50 transition"
                >
                  Đăng nhập / Đăng ký
                </Link>
              ) : (
                <Link
                  to="/account/points"
                  className="px-7 py-3 rounded-full bg-white border border-gray-200 text-gray-800 font-black hover:bg-gray-50 transition"
                >
                  Xem tích điểm
                </Link>
              )}
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-green-500/20 relative overflow-hidden">
            <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-yellow-400/15 blur-2xl" />
            <p className="text-xs font-black uppercase tracking-widest text-white/80">
              Ưu đãi hôm nay
            </p>
            <h4 className="text-2xl md:text-3xl font-black mt-2">
              Miễn phí giao hàng cho đơn từ{" "}
              <span className="text-yellow-300">99.000₫</span>
            </h4>
            <p className="text-white/90 mt-3 max-w-md">
              Áp dụng trong nội thành. Đặt sớm để nhận khung giờ giao tốt nhất.
            </p>
            <div className="mt-7 bg-white/10 border border-white/15 rounded-3xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-white/70">
                    Mã ưu đãi
                  </p>
                  <p className="text-xl font-black">DINHDUONG99</p>
                </div>
                <span className="text-xs font-black bg-yellow-400 text-yellow-900 px-3 py-1.5 rounded-full">
                  -15%
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  to="/menu"
                  className="px-6 py-2.5 rounded-full bg-white text-green-700 font-black hover:bg-green-50 transition"
                >
                  Dùng ngay
                </Link>
                <Link
                  to="/menu"
                  className="px-6 py-2.5 rounded-full bg-white/0 border border-white/30 text-white font-black hover:bg-white/10 transition"
                >
                  Xem điều kiện
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-20 border-y border-green-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
            <div>
              <h3 className="text-3xl font-black text-gray-800">
                Khách hàng nói gì?
              </h3>
              <p className="text-gray-500 mt-2">
                Trải nghiệm thật từ những gia đình đã đặt món thường xuyên.
              </p>
            </div>
            <Link
              to="/menu"
              className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-yellow-400 text-yellow-900 font-black shadow-md shadow-yellow-400/20 hover:bg-yellow-500 transition"
            >
              Đặt món ngay
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="bg-gray-50 rounded-[2rem] border border-gray-100 p-6 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-black text-gray-800">{t.name}</p>
                    <p className="text-xs text-gray-500 font-bold mt-0.5">
                      {t.meta}
                    </p>
                  </div>
                  <div className="text-yellow-500 text-sm font-black">
                    {"★".repeat(t.rating)}
                  </div>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mt-4">
                  “{t.quote}”
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-10 items-start">
          <div>
            <h3 className="text-3xl font-black text-gray-800">
              Câu hỏi thường gặp
            </h3>
            <p className="text-gray-500 mt-2 max-w-xl">
              Một vài thắc mắc phổ biến trước khi bạn đặt món.
            </p>
            <div className="mt-8 space-y-4">
              {faqs.map((f) => (
                <details
                  key={f.q}
                  className="group bg-white rounded-3xl border border-gray-100 p-5 shadow-sm open:shadow-md transition"
                >
                  <summary className="cursor-pointer list-none flex items-center justify-between gap-4">
                    <span className="font-black text-gray-800">{f.q}</span>
                    <span className="text-gray-400 group-open:rotate-45 transition-transform font-black text-xl">
                      +
                    </span>
                  </summary>
                  <p className="text-sm text-gray-500 mt-3 leading-relaxed">
                    {f.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
          <div className="bg-gray-900 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-black/10">
            <p className="text-xs font-black uppercase tracking-widest text-white/60">
              Hỗ trợ nhanh
            </p>
            <h4 className="text-2xl font-black mt-2">
              Sẵn sàng tư vấn khẩu phần cho bé
            </h4>
            <p className="text-white/80 mt-3">
              Đăng nhập để lưu địa chỉ, đặt lại đơn cũ và nhận ưu đãi thành
              viên.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              {!isAuthenticated ? (
                <Link
                  to="/login"
                  className="px-7 py-3 rounded-full bg-white text-gray-900 font-black hover:bg-gray-100 transition"
                >
                  Đăng nhập
                </Link>
              ) : (
                <Link
                  to="/account"
                  className="px-7 py-3 rounded-full bg-white text-gray-900 font-black hover:bg-gray-100 transition"
                >
                  Thông tin tài khoản
                </Link>
              )}
              <Link
                to="/menu"
                className="px-7 py-3 rounded-full bg-white/0 border border-white/20 text-white font-black hover:bg-white/10 transition"
              >
                Xem thực đơn
              </Link>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <p className="text-xs font-black uppercase tracking-widest text-white/60">
                  Hotline
                </p>
                <p className="font-black mt-1">1900 xxxx</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <p className="text-xs font-black uppercase tracking-widest text-white/60">
                  Email
                </p>
                <p className="font-black mt-1">contact@food.com</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
