import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import { getCurrentClientUser } from "../../utils/auth";

const formatVnd = (value) => `${Number(value || 0).toLocaleString("vi-VN")}₫`;

// Helper hiển thị ảnh
const getAvatarUrl = (avatar) => {
  if (!avatar) return null;
  if (avatar.startsWith("http") || avatar.startsWith("data:")) return avatar;
  return `http://localhost:5017${avatar}`; // Đổi port C# của bạn nếu khác
};

const CartPage = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load Giỏ Hàng
  const loadCart = async () => {
    const user = getCurrentClientUser();
    if (!user) {
      navigate("/login");
      return;
    }
    try {
      setLoading(true);
      const res = await axiosClient.get("/client/cart/my-cart", {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setCartItems(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  // Thay đổi số lượng bát cháo
  const handleUpdateQty = async (id, currentQty, delta) => {
    const newQty = currentQty + delta;
    if (newQty < 1) return; // Nếu < 1 thì không làm gì (Bắt người dùng ấn nút Xóa)

    // Cập nhật UI ngay lập tức cho mượt
    setCartItems((prev) =>
      prev.map((item) =>
        item.cartDetailId === id ? { ...item, soLuong: newQty } : item,
      ),
    );

    try {
      const user = getCurrentClientUser();
      await axiosClient.put(`/client/cart/update-qty/${id}`, newQty, {
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "application/json",
        },
      });
      // Bắn event để cập nhật Header
      window.dispatchEvent(
        new CustomEvent("cartUpdated", { detail: { qty: delta } }),
      );
    } catch (err) {
      alert("Lỗi khi cập nhật số lượng!");
      loadCart(); // Rollback nếu lỗi
    }
  };

  // Xóa bát cháo khỏi giỏ
  const handleRemove = async (id, soLuong) => {
    if (!window.confirm("Bạn có chắc muốn xóa món này khỏi giỏ?")) return;

    try {
      const user = getCurrentClientUser();
      await axiosClient.delete(`/client/cart/remove/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });

      // Xóa khỏi State
      setCartItems((prev) => prev.filter((item) => item.cartDetailId !== id));

      // Trừ đi số lượng trên Header Layout
      window.dispatchEvent(
        new CustomEvent("cartUpdated", { detail: { action: "reload" } }),
      );
    } catch (err) {
      alert("Lỗi khi xóa món!");
    }
  };

  // Tính tiền cho 1 Dòng (Bao gồm Size + Topping) * Số lượng bát
  const calculateItemTotal = (item) => {
    const toppingTotal = item.toppings.reduce(
      (sum, t) => sum + t.giaTopping * t.soLuong,
      0,
    );
    return (item.giaBan + toppingTotal) * item.soLuong;
  };

  // Tính Tổng Tiền Toàn Giỏ
  const cartTotal = cartItems.reduce(
    (sum, item) => sum + calculateItemTotal(item),
    0,
  );

  if (loading)
    return (
      <div className="text-center py-20 font-bold text-green-600">
        Đang tải giỏ hàng...
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 animate-fade-in font-sans">
      <h1 className="text-3xl font-black text-gray-800 mb-8">
        Giỏ hàng của bạn
      </h1>

      {cartItems.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center border border-dashed border-gray-300">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-2xl font-black text-gray-800 mb-2">
            Giỏ hàng trống
          </h2>
          <p className="text-gray-500 mb-8">
            Bạn chưa thêm món ngon nào vào giỏ cả.
          </p>
          <Link
            to="/menu"
            className="bg-green-500 text-white px-8 py-3 rounded-full font-black hover:bg-green-600 transition shadow-lg shadow-green-500/30"
          >
            Khám phá thực đơn ngay
          </Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* CỘT TRÁI: DANH SÁCH MÓN */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <div
                key={item.cartDetailId}
                className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-5 relative"
              >
                {/* Nút Xóa Món */}
                <button
                  onClick={() => handleRemove(item.cartDetailId, item.soLuong)}
                  className="absolute top-4 right-4 text-gray-300 hover:text-red-500 font-bold transition"
                >
                  ✕
                </button>

                <div className="w-24 h-24 sm:w-32 sm:h-32 bg-green-50 rounded-2xl overflow-hidden shrink-0">
                  {item.hinhAnh ? (
                    <img
                      src={getAvatarUrl(item.hinhAnh)}
                      alt={item.tenMon}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">
                      🥣
                    </div>
                  )}
                </div>

                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-black text-lg text-gray-800 pr-6 leading-tight">
                      {item.tenMon}{" "}
                      <span className="text-sm font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-md ml-1">
                        Size {item.size}
                      </span>
                    </h3>

                    {item.isKhongNau && (
                      <span className="inline-block mt-2 text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-1 rounded">
                        🧊 Mang về tự nấu
                      </span>
                    )}

                    <div className="mt-2 space-y-1 text-sm text-gray-600">
                      {item.rauCu && (
                        <p>
                          <span className="font-bold">Rau củ:</span>{" "}
                          {item.rauCu}
                        </p>
                      )}
                      {item.toppings.map((t, idx) => (
                        <p key={idx}>
                          <span className="font-bold">Topping:</span>{" "}
                          {t.tenTopping}{" "}
                          <span className="text-xs text-gray-400">
                            (x{t.soLuong})
                          </span>{" "}
                          -{" "}
                          <span className="text-green-600 text-xs">
                            +{formatVnd(t.giaTopping * t.soLuong)}
                          </span>
                        </p>
                      ))}
                      {item.ghiChu && (
                        <p className="italic text-gray-500">"{item.ghiChu}"</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 border-t border-gray-50 pt-4">
                    <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-2 py-1 border border-gray-200">
                      <button
                        onClick={() =>
                          handleUpdateQty(item.cartDetailId, item.soLuong, -1)
                        }
                        className="w-8 h-8 flex items-center justify-center font-bold text-gray-500 hover:text-red-500"
                      >
                        -
                      </button>
                      <span className="font-black text-gray-800 w-4 text-center">
                        {item.soLuong}
                      </span>
                      <button
                        onClick={() =>
                          handleUpdateQty(item.cartDetailId, item.soLuong, 1)
                        }
                        className="w-8 h-8 flex items-center justify-center font-bold text-gray-500 hover:text-green-500"
                      >
                        +
                      </button>
                    </div>
                    <div className="font-black text-xl text-green-600">
                      {formatVnd(calculateItemTotal(item))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CỘT PHẢI: TỔNG KẾT & THANH TOÁN */}
          <div className="lg:sticky lg:top-24 h-fit bg-white rounded-3xl border border-yellow-200 shadow-sm p-6 bg-gradient-to-b from-yellow-50/50 to-white">
            <h3 className="font-black text-lg text-gray-800 mb-6 uppercase tracking-wider">
              Tổng Đơn Hàng
            </h3>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Tổng tiền hàng:</span>
                <span className="font-bold text-gray-800">
                  {formatVnd(cartTotal)}
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Phí giao hàng:</span>
                <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded italic">
                  Tính ở bước sau
                </span>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4 mb-6">
              <div className="flex justify-between items-end">
                <span className="font-black text-gray-800">Tạm tính:</span>
                <span className="font-black text-3xl text-green-600">
                  {formatVnd(cartTotal)}
                </span>
              </div>
            </div>

            <Link
              to="/checkout"
              className="w-full block text-center py-4 rounded-2xl bg-yellow-400 text-yellow-900 font-black hover:bg-yellow-500 shadow-lg shadow-yellow-400/20 transition-all text-lg active:scale-95"
            >
              Tiến Hành Thanh Toán
            </Link>

            <Link
              to="/menu"
              className="w-full block text-center mt-3 py-3 text-sm font-bold text-gray-500 hover:text-green-600 transition"
            >
              ← Tiếp tục chọn món
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
