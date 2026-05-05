import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import productApi from "../../api/productApi";
import axiosClient from "../../api/axiosClient";
import { getCurrentClientUser } from "../../utils/auth";

const formatVnd = (value) => `${Number(value || 0).toLocaleString("vi-VN")}₫`;

// Helper: Xử lý hiển thị ảnh từ server
const getAvatarUrl = (avatar) => {
  if (!avatar) return null;
  if (avatar.startsWith("http") || avatar.startsWith("data:")) return avatar;
  if (avatar.startsWith("/")) return `http://localhost:5017${avatar}`;
  return avatar;
};

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Dữ liệu từ API
  const [product, setProduct] = useState(null);
  const [veggies, setVeggies] = useState([]); // Rau củ (Từ NguyenLieu)
  const [toppings, setToppings] = useState([]); // Topping (Từ SanPham)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Trạng thái lựa chọn của khách
  const [selectedOption, setSelectedOption] = useState(null);
  const [isKhongNau, setIsKhongNau] = useState(false);
  const [selectedVeggie, setSelectedVeggie] = useState(null);
  const [selectedToppings, setSelectedToppings] = useState([]); // [{id, name, price, qty}]
  const [note, setNote] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    let alive = true;
    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        // Gọi API Menu và API extras mới (đã chia sẵn veggies và toppings)
        const [menuRes, extraRes] = await Promise.all([
          productApi.getMenuClient(),
          axiosClient
            .get("/client/menu/extras")
            .catch(() => ({ data: { veggies: [], toppings: [] } })),
        ]);

        if (!alive) return;

        // Tìm món ăn hiện tại theo tên trên URL
        const decodedName = decodeURIComponent(id);
        const found = menuRes.find((p) => p.sanPhamName === decodedName);

        if (found) {
          setProduct(found);
          setSelectedOption(found.options[0]);
        } else {
          setError("Không tìm thấy sản phẩm này.");
        }

        // Gán danh sách Rau củ và Topping
        setVeggies(extraRes.data?.veggies || []);
        setToppings(extraRes.data?.toppings || []);
      } catch (e) {
        if (!alive) return;
        setError(e?.response?.data || e?.message || "Lỗi tải dữ liệu.");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    };
    loadData();
    return () => {
      alive = false;
    };
  }, [id]);

  // Tính tổng giá: Giá cháo + (Giá mỗi Topping * Số lượng)
  const totalPrice = useMemo(() => {
    if (!product || !selectedOption) return 0;
    let toppingSum = selectedToppings.reduce(
      (sum, item) => sum + (item.price || 0) * item.qty,
      0,
    );
    return selectedOption.giaBan + toppingSum;
  }, [product, selectedOption, selectedToppings]);

  // Hàm xử lý tăng giảm số lượng Topping (Sản phẩm bán kèm)
  const handleToppingChange = (item, delta) => {
    setSelectedToppings((prev) => {
      const existing = prev.find((t) => t.id === item.id);
      if (existing) {
        const newQty = existing.qty + delta;
        if (newQty <= 0) return prev.filter((t) => t.id !== item.id);
        return prev.map((t) => (t.id === item.id ? { ...t, qty: newQty } : t));
      }
      if (delta > 0) return [...prev, { ...item, qty: 1 }];
      return prev;
    });
  };

  // HÀM QUAN TRỌNG: GỬI DỮ LIỆU LÊN SERVER
  const handleAddToCart = async () => {
    const user = getCurrentClientUser();
    if (!user || !user.token) {
      alert("Vui lòng đăng nhập để thêm món vào giỏ hàng!");
      navigate("/login");
      return;
    }

    // Payload chuẩn theo Model CartDetailTopping mới
    const payload = {
      SanPhamId: selectedOption.sanPhamId, // ID món cháo (đã bao gồm size)
      SoLuong: 1,
      IsKhongNau: isKhongNau,
      RauCuNguyenLieuId: selectedVeggie ? selectedVeggie.id : null, // Rau củ (NguyenLieuId)
      GhiChu: note,
      Toppings: selectedToppings.map((t) => ({
        ToppingSanPhamId: t.id, // Topping (SanPhamId)
        SoLuong: t.qty,
      })),
    };

    try {
      setIsAdding(true);
      await axiosClient.post("/client/cart/add", payload, {
        headers: { Authorization: `Bearer ${user.token}` },
      });

      // Kích hoạt event để Header Layout tự tăng số lượng (cartCount)
      window.dispatchEvent(
        new CustomEvent("cartUpdated", { detail: { qty: 1 } }),
      );

      alert(`Đã thêm ${product.sanPhamName} vào giỏ hàng thành công!`);
    } catch (err) {
      alert(err?.response?.data || "Lỗi hệ thống khi thêm vào giỏ hàng!");
    } finally {
      setIsAdding(false);
    }
  };

  if (loading)
    return (
      <div className="text-center py-20 text-green-600 font-bold">
        Đang chuẩn bị nguyên liệu...
      </div>
    );
  if (error || !product)
    return (
      <div className="text-center py-20 text-red-500 font-bold">{error}</div>
    );

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 animate-fade-in font-sans">
      <div className="mb-6 flex items-center justify-between text-sm font-black">
        <div className="space-x-3">
          <Link to="/" className="text-green-600 hover:underline">
            Trang chủ
          </Link>
          <span className="text-gray-400">/</span>
          <Link to="/menu" className="text-green-600 hover:underline">
            Thực đơn
          </Link>
        </div>
        <button
          onClick={() => navigate("/menu")}
          className="text-gray-700 hover:text-green-600"
        >
          ← Quay lại
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-10 bg-white p-6 lg:p-8 rounded-3xl shadow-sm border border-green-50">
        {/* CỘT TRÁI: ẢNH & THÔNG TIN CHÍNH (BÂY GIỜ LÀ STICKY CẢ KHỐI) */}
        <div className="lg:sticky lg:top-24 h-fit space-y-6">
          {/* === KHỐI TÊN MÓN VÀ TỔNG GIÁ (TRÊN ĐẦU ẢNH) === */}
          <div className="px-1 py-1">
            <h1 className="text-3xl lg:text-4xl font-black text-gray-800 uppercase tracking-tighter leading-tight">
              {product.sanPhamName}
            </h1>
            <div className="mt-3.5 flex flex-col gap-1.5 bg-green-50 px-5 py-3 rounded-2xl border border-green-100 shadow-inner">
              <span className="text-[11px] font-black text-green-700 uppercase tracking-widest">
                Tổng thanh toán dự tính:
              </span>
              <p className="text-3xl lg:text-4xl font-black text-green-600 italic tracking-tight">
                {formatVnd(totalPrice)}
              </p>
            </div>
          </div>

          {/* === KHỐI ẢNH (DƯỚI TÊN VÀ GIÁ) === */}
          <div className="aspect-square bg-green-50 rounded-[2.5rem] overflow-hidden shadow-inner relative border border-green-100 group">
            {product.hinhAnh ? (
              <img
                src={getAvatarUrl(product.hinhAnh)}
                alt={product.sanPhamName}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-9xl text-green-200">
                🥣
              </div>
            )}

            {/* Badge trạng thái nấu */}
            {isKhongNau && (
              <div className="absolute top-5 left-5 bg-blue-500 text-white text-[10px] font-black uppercase px-4 py-2 rounded-full shadow-lg border border-white/20 animate-pulse">
                Mang về tự nấu
              </div>
            )}
          </div>
        </div>

        {/* CỘT PHẢI: TÙY CHỌN MUA HÀNG */}
        <div className="space-y-6 text-gray-800">
          {/* CHẾ ĐỘ NẤU */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
            <div className="max-w-[70%]">
              <h4 className="font-bold text-sm">Mang về tự nấu</h4>
              <p className="text-[11px] text-gray-500">
                Shop sẽ chuẩn bị nguyên liệu tươi sống (kèm cốc giấy) để mẹ tự
                nấu tại nhà cho nóng.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={isKhongNau}
                onChange={(e) => setIsKhongNau(e.target.checked)}
              />
              <div className="w-12 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
            </label>
          </div>

          {/* CHỌN SIZE */}
          <div className="pt-4 border-t border-gray-100">
            <h4 className="font-bold mb-3 uppercase text-[11px] tracking-widest text-gray-400">
              Kích cỡ (Size): <span className="text-red-500">*</span>
            </h4>
            <div className="flex flex-wrap gap-2">
              {product.options.map((opt) => (
                <button
                  key={opt.sanPhamId}
                  onClick={() => setSelectedOption(opt)}
                  className={`px-6 py-2 rounded-xl border-2 font-bold text-sm transition-all ${selectedOption?.sanPhamId === opt.sanPhamId ? "border-green-500 bg-green-50 text-green-700" : "border-gray-100 text-gray-400 hover:border-green-200"}`}
                >
                  {opt.size}
                </button>
              ))}
            </div>
          </div>

          {/* CHỌN RAU CỦ (MIỄN PHÍ) */}
          {veggies.length > 0 && (
            <div className="pt-4 border-t border-gray-100">
              <h4 className="font-bold mb-3 uppercase text-[11px] tracking-widest text-gray-400">
                Mix Rau Củ (Chọn 1 loại):
              </h4>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedVeggie(null)}
                  className={`px-4 py-2 rounded-xl border-2 font-bold text-xs transition-all ${!selectedVeggie ? "border-orange-400 bg-orange-50 text-orange-700" : "border-gray-50 text-gray-400"}`}
                >
                  Không thêm
                </button>
                {veggies.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVeggie(v)}
                    className={`px-4 py-2 rounded-xl border-2 font-bold text-xs transition-all ${selectedVeggie?.id === v.id ? "border-green-500 bg-green-50 text-green-700" : "border-gray-50 text-gray-400"}`}
                  >
                    {v.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* CHỌN TOPPING (TÍNH TIỀN) */}
          {toppings.length > 0 && (
            <div className="pt-4 border-t border-gray-100">
              <h4 className="font-bold mb-3 uppercase text-[11px] tracking-widest text-gray-400">
                Thêm Topping Dinh Dưỡng:
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2 scrollbar-thin">
                {toppings.map((item) => {
                  const sel = selectedToppings.find((t) => t.id === item.id);
                  return (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between p-3 rounded-2xl border-2 transition-all ${sel ? "border-green-200 bg-green-50/50" : "border-gray-50 bg-gray-50"}`}
                    >
                      <p className="font-bold text-gray-700 text-xs">
                        {item.name}
                      </p>
                      <div className="flex items-center gap-2">
                        {sel && (
                          <div className="flex items-center gap-2 bg-white rounded-lg px-2 py-1 shadow-sm border border-green-100">
                            <button
                              onClick={() => handleToppingChange(item, -1)}
                              className="w-6 h-6 text-gray-400 hover:text-red-500"
                            >
                              -
                            </button>
                            <span className="text-xs font-black text-green-600 w-4 text-center">
                              {sel.qty}
                            </span>
                            <button
                              onClick={() => handleToppingChange(item, 1)}
                              className="w-6 h-6 text-gray-400 hover:text-green-500"
                            >
                              +
                            </button>
                          </div>
                        )}
                        {!sel && (
                          <button
                            onClick={() => handleToppingChange(item, 1)}
                            className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-[10px] font-black text-gray-400 hover:border-green-500 hover:text-green-600 transition-all"
                          >
                            + {formatVnd(item.price)}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* GHI CHÚ */}
          <div className="pt-4 border-t border-gray-100">
            <textarea
              rows="2"
              placeholder="Ghi chú (Ví dụ: Xay nhuyễn cho bé 6 tháng, không cho nước mắm...)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full border-2 border-gray-100 rounded-2xl p-3 text-sm focus:border-green-400 outline-none transition-all resize-none bg-gray-50 focus:bg-white"
            />
          </div>

          <button
            onClick={handleAddToCart}
            disabled={isAdding}
            className="w-full py-4 rounded-2xl bg-yellow-400 text-yellow-900 font-black hover:bg-yellow-500 shadow-lg shadow-yellow-400/20 active:scale-[0.98] transition-all text-lg disabled:opacity-50"
          >
            {isAdding ? "Đang xử lý..." : "Thêm vào giỏ hàng 🥣"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
