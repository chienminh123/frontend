import React, { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import clientAccountApi from "../../api/clientAccountApi";
import { getCurrentClientUser } from "../../utils/auth";

const formatVnd = (value) => `${Number(value || 0).toLocaleString("vi-VN")}₫`;

const CheckoutPage = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shippingFee, setShippingFee] = useState(15000);

  // 🎯 1. STATE LƯU MÃ BÁO GIÁ LALAMOVE
  const [lalamoveQuotationId, setLalamoveQuotationId] = useState("");

  const [formData, setFormData] = useState({
    tenNguoiNhan: "",
    sdtNguoiNhan: "",
    diaChiGiaoHang: "",
    ghiChuDonHang: "",
    phuongThucThanhToan: "COD",
    shopId: null,
    shopName: "",
  });

  useEffect(() => {
    let alive = true;
    const initData = async () => {
      const user = getCurrentClientUser();
      if (!user) {
        navigate("/login");
        return;
      }

      try {
        setLoading(true);
        const cartRes = await axiosClient.get("/client/cart/my-cart", {
          headers: { Authorization: `Bearer ${user.token}` },
        });

        if (!alive) return;
        const items = cartRes.data || [];
        if (items.length === 0) {
          alert("Giỏ hàng trống, vui lòng chọn món trước khi thanh toán.");
          navigate("/menu");
          return;
        }
        setCartItems(items);

        const profile = await clientAccountApi.me();
        if (profile && alive) {
          setFormData((prev) => ({
            ...prev,
            tenNguoiNhan: profile.tenKhachHang || user.name || "",
            sdtNguoiNhan: profile.sdt || "",
            diaChiGiaoHang: profile.diaChi || "",
          }));
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (alive) setLoading(false);
      }
    };
    initData();
    return () => {
      alive = false;
    };
  }, [navigate]);

  const calculateItemTotal = (item) => {
    const toppingTotal = item.toppings.reduce(
      (sum, t) => sum + t.giaTopping * t.soLuong,
      0,
    );
    return (item.giaBan + toppingTotal) * item.soLuong;
  };

  const subTotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + calculateItemTotal(item), 0),
    [cartItems],
  );

  const finalShippingFee = useMemo(
    () => (subTotal >= 99000 ? 0 : shippingFee),
    [subTotal, shippingFee],
  );
  const totalAmount = subTotal + finalShippingFee;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEstimateFee = async () => {
    if (!formData.diaChiGiaoHang || formData.diaChiGiaoHang.length < 10) return;

    try {
      const searchQuery = encodeURIComponent(
        formData.diaChiGiaoHang + ", Hà Nội, Việt Nam",
      );
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${searchQuery}`,
      );
      const geoData = await geoRes.json();

      if (geoData && geoData.length > 0) {
        const lat = geoData[0].lat;
        const lng = geoData[0].lon;

        const nearestRes = await axiosClient.get(
          `/client/order/nearest?lat=${lat}&lng=${lng}`,
        );
        const shopId = nearestRes.data.shopId;
        const shopName = nearestRes.data.tenCuaHang;
        setFormData((prev) => ({
          ...prev,
          shopId: shopId,
          shopName: shopName,
        }));

        const res = await axiosClient.get(
          `/client/delivery/estimate-fee?destination=${encodeURIComponent(formData.diaChiGiaoHang)}&lat=${lat}&lng=${lng}&shopId=${nearestRes.data.shopId}&customerName=${encodeURIComponent(formData.tenNguoiNhan)}&customerPhone=${encodeURIComponent(formData.sdtNguoiNhan)}`,
        );

        // 🎯 2. ĐÃ VÁ: Nhận về cả phí và quotationId từ Backend mới nâng cấp
        setShippingFee(res.data.fee);
        setLalamoveQuotationId(res.data.quotationId || "");
      }
    } catch (err) {
      console.error("Lỗi khi tính phí hoặc tìm cửa hàng:", err);
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (
      !formData.tenNguoiNhan ||
      !formData.sdtNguoiNhan ||
      !formData.diaChiGiaoHang
    ) {
      return alert("Vui lòng điền đầy đủ thông tin giao hàng!");
    }

    const payload = {
      TenNguoiNhan: formData.tenNguoiNhan,
      SdtNguoiNhan: formData.sdtNguoiNhan,
      DiaChiGiaoHang: formData.diaChiGiaoHang,
      PhuongThucThanhToan: formData.phuongThucThanhToan,
      GhiChuDonHang: formData.ghiChuDonHang,
      TongTienHang: subTotal,
      PhiGiaoHang: finalShippingFee,
      ShopId: formData.shopId,

      // 🎯 3. ĐÃ VÁ: Đóng gói mã báo giá đẩy xuống API checkout C#
      LalamoveQuotationId: lalamoveQuotationId,
    };

    try {
      setIsSubmitting(true);
      const user = getCurrentClientUser();
      const res = await axiosClient.post("/client/order/checkout", payload, {
        headers: { Authorization: `Bearer ${user.token}` },
      });

      if (payload.PhuongThucThanhToan === "VNPAY" && res.data?.paymentUrl) {
        window.location.href = res.data.paymentUrl;
        return;
      }

      window.dispatchEvent(
        new CustomEvent("cartUpdated", { detail: { action: "clear" } }),
      );
      alert("🎉 Đặt hàng thành công!");
      navigate("/account/my-orders");
    } catch (err) {
      console.error("Lỗi từ server C#:", err?.response?.data || err);
      const errorMsg =
        typeof err?.response?.data === "string"
          ? err.response.data
          : err?.response?.data?.message || "Lỗi hệ thống khi đặt hàng!";
      alert(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="text-center py-20 font-bold text-green-600">
        Đang chuẩn bị thanh toán...
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 animate-fade-in font-sans">
      <div className="mb-6">
        <Link
          to="/cart"
          className="text-sm font-black text-gray-400 hover:text-green-600 transition"
        >
          ← Quay lại giỏ hàng
        </Link>
        <h1 className="text-3xl font-black text-gray-800 mt-2">
          Thanh toán đơn hàng
        </h1>
      </div>

      <form onSubmit={handlePlaceOrder} className="grid lg:grid-cols-5 gap-10">
        {/* CỘT TRÁI: THÔNG TIN GIAO HÀNG */}
        <div className="lg:col-span-3 space-y-8">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-green-50">
            <h2 className="text-lg font-black text-gray-800 mb-5 flex items-center gap-2">
              <span className="text-green-500">📍</span> Thông tin nhận hàng
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">
                  Tên người nhận <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="tenNguoiNhan"
                  required
                  value={formData.tenNguoiNhan}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">
                  Số điện thoại <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="sdtNguoiNhan"
                  required
                  value={formData.sdtNguoiNhan}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">
                  Địa chỉ giao hàng <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="diaChiGiaoHang"
                  required
                  value={formData.diaChiGiaoHang}
                  onChange={handleChange}
                  onBlur={handleEstimateFee}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="Nhập địa chỉ rồi click ra ngoài để tính phí ship..."
                />
                {formData.shopName && (
                  <div className="mt-3 p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3 animate-fade-in">
                    <span className="text-blue-500 text-lg">🏪</span>
                    <div>
                      <p className="text-sm text-blue-800 font-bold">
                        Đơn hàng sẽ được chuẩn bị tại:
                      </p>
                      <p className="text-sm text-blue-600">
                        {formData.shopName}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">
                  Ghi chú đơn hàng
                </label>
                <textarea
                  name="ghiChuDonHang"
                  rows="2"
                  value={formData.ghiChuDonHang}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-green-500 outline-none resize-none"
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-green-50">
            <h2 className="text-lg font-black text-gray-800 mb-5 flex items-center gap-2">
              <span className="text-yellow-500">💳</span> Phương thức thanh toán
            </h2>
            <div className="space-y-3">
              <label
                className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition ${formData.phuongThucThanhToan === "COD" ? "border-green-500 bg-green-50" : "border-gray-100"}`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="phuongThucThanhToan"
                    value="COD"
                    checked={formData.phuongThucThanhToan === "COD"}
                    onChange={handleChange}
                    className="w-5 h-5 text-green-600"
                  />
                  <span className="font-bold text-gray-800">
                    Thanh toán khi nhận hàng (COD)
                  </span>
                </div>
                <span className="text-2xl">💵</span>
              </label>
              <label
                className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition ${formData.phuongThucThanhToan === "VNPAY" ? "border-blue-500 bg-blue-50" : "border-gray-100 hover:border-blue-200"}`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="phuongThucThanhToan"
                    value="VNPAY"
                    checked={formData.phuongThucThanhToan === "VNPAY"}
                    onChange={handleChange}
                    className="w-5 h-5 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="font-bold text-gray-800 block">
                      Thanh toán VNPAY
                    </span>
                    <span className="text-[11px] text-gray-500">
                      Quét mã QR hoặc dùng thẻ ATM nội địa
                    </span>
                  </div>
                </div>
                <span className="text-2xl">💳</span>
              </label>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: TỔNG KẾT ĐƠN HÀNG */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 lg:sticky lg:top-24">
            <h3 className="font-black text-lg text-gray-800 mb-6 uppercase tracking-wider">
              Tóm tắt đơn hàng
            </h3>

            <div className="space-y-4 mb-6 max-h-[40vh] overflow-y-auto pr-2">
              {cartItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-start gap-4"
                >
                  <div className="flex gap-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden shrink-0">
                      <img
                        src={
                          item.hinhAnh
                            ? `http://localhost:5017${item.hinhAnh}`
                            : "https://via.placeholder.com/50"
                        }
                        alt="mon"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-gray-800 leading-tight">
                        {item.tenMon} (x{item.soLuong})
                      </p>
                      <div className="text-[11px] text-gray-500 mt-1 space-y-1">
                        <p>Size {item.size}</p>
                        {item.isKhongNau && (
                          <p className="text-blue-500 font-bold uppercase tracking-wider">
                            🧊 Mang về tự nấu
                          </p>
                        )}
                        {item.rauCu && <p>🥬 Rau củ: {item.rauCu}</p>}
                        {item.toppings?.length > 0 &&
                          item.toppings.map((t, i) => (
                            <p key={i}>
                              🧀 {t.tenTopping} (x{t.soLuong})
                            </p>
                          ))}
                        {item.ghiChu && (
                          <p className="italic text-gray-400">
                            📝 "{item.ghiChu}"
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="font-bold text-sm text-gray-800">
                    {formatVnd(calculateItemTotal(item))}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-3 pt-4 border-t border-dashed border-gray-200 mb-6">
              <div className="flex justify-between text-gray-600 text-sm">
                <span>Tạm tính ({cartItems.length} món):</span>
                <span className="font-bold">{formatVnd(subTotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600 text-sm items-center">
                <span>Phí giao hàng:</span>
                {finalShippingFee === 0 ? (
                  <span className="font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded">
                    Miễn phí
                  </span>
                ) : (
                  <span className="font-bold">
                    {formatVnd(finalShippingFee)}
                  </span>
                )}
              </div>
              {subTotal < 99000 && (
                <p className="text-[10px] text-orange-500 italic text-right">
                  Mua thêm {formatVnd(99000 - subTotal)} để được Freeship nội
                  thành!
                </p>
              )}
            </div>

            <div className="border-t border-gray-200 pt-4 mb-6">
              <div className="flex justify-between items-end">
                <span className="font-black text-gray-800">Tổng cộng:</span>
                <span className="font-black text-3xl text-green-600">
                  {formatVnd(totalAmount)}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full block text-center py-4 rounded-2xl bg-green-500 text-white font-black hover:bg-green-600 shadow-lg shadow-green-500/30 transition-all text-lg active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? "Đang xử lý..." : "Đặt hàng ngay"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CheckoutPage;
