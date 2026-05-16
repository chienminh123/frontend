import React, { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import { getCurrentClientUser } from "../../utils/auth";

const formatVnd = (value) => `${Number(value || 0).toLocaleString("vi-VN")}₫`;

// Hàm dịch trạng thái đơn hàng cho đẹp
const getStatusBadge = (status) => {
  switch (status) {
    case "CHO_THANH_TOAN":
      return (
        <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-black">
          Chờ thanh toán VNPAY
        </span>
      );
    case "CHO_XAC_NHAN":
      return (
        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-black">
          Chờ xác nhận
        </span>
      );
    case "DANG_GIAO":
      return (
        <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-black">
          Đang giao hàng
        </span>
      );
    case "HOAN_THANH":
      return (
        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-black">
          Đã hoàn thành
        </span>
      );
    case "DA_HUY":
      return (
        <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-black">
          Đã hủy
        </span>
      );
    default:
      return (
        <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-black">
          {status}
        </span>
      );
  }
};

const OrderHistoryPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // State cho Modal chi tiết hóa đơn
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [orderDetail, setOrderDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const user = getCurrentClientUser();
        const res = await axiosClient.get("/client/order/my-orders", {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setOrders(res.data);
      } catch (err) {
        console.error("Lỗi tải đơn hàng:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  // Hàm lấy chi tiết khi bấm vào đơn hàng
  const handleViewDetail = async (orderId) => {
    setSelectedOrderId(orderId);
    setLoadingDetail(true);
    setOrderDetail(null); // Reset detail cũ
    try {
      const user = getCurrentClientUser();
      const res = await axiosClient.get(`/client/order/my-orders/${orderId}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setOrderDetail(res.data);
    } catch (err) {
      alert("Không thể tải chi tiết đơn hàng.");
      setSelectedOrderId(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  if (loading)
    return (
      <div className="py-20 text-center font-bold text-green-600">
        Đang tải lịch sử đơn hàng...
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 animate-fade-in font-sans relative">
      <h1 className="text-3xl font-black text-gray-800 mb-8">
        Lịch sử đặt hàng
      </h1>

      {orders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-gray-300 p-16 text-center">
          <div className="text-6xl mb-4">🧾</div>
          <h2 className="text-xl font-black text-gray-800">
            Chưa có đơn hàng nào
          </h2>
          <p className="text-gray-500 mt-2 mb-6">
            Bạn chưa đặt món cháo dinh dưỡng nào cả.
          </p>
          <Link
            to="/menu"
            className="bg-green-500 text-white px-6 py-3 rounded-full font-bold"
          >
            Đi đến thực đơn
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div>
                <p className="text-sm text-gray-500 font-bold">
                  Mã đơn:{" "}
                  <span className="text-gray-800">{order.maDonHang}</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(order.ngayTao).toLocaleString("vi-VN")}
                </p>
                <div className="mt-2">
                  {getStatusBadge(order.trangThaiDonHang)}
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-sm text-gray-500 font-bold">Tổng tiền</p>
                  <p className="text-xl font-black text-green-600">
                    {formatVnd(order.thanhTien)}
                  </p>
                </div>
                <button
                  onClick={() => handleViewDetail(order.id)}
                  className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-5 py-2 rounded-xl font-bold transition"
                >
                  Xem chi tiết
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* POPUP HIỂN THỊ HÓA ĐƠN CHI TIẾT */}
      {selectedOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedOrderId(null)}
              className="absolute top-4 right-4 w-8 h-8 bg-gray-100 rounded-full font-bold text-gray-500 hover:bg-red-500 hover:text-white transition"
            >
              ✕
            </button>

            {loadingDetail ? (
              <div className="py-20 text-center font-bold text-gray-500">
                Đang tải hóa đơn...
              </div>
            ) : orderDetail ? (
              <div>
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-black text-green-600 uppercase">
                    HÓA ĐƠN MUA HÀNG
                  </h2>
                  <p className="text-sm text-gray-500 font-bold mt-1">
                    {orderDetail.shopName}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(orderDetail.ngayTao).toLocaleString("vi-VN")}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Mã: {orderDetail.maDonHang}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 mb-4 text-sm text-gray-700">
                  <p>
                    <span className="font-bold">Người nhận:</span>{" "}
                    {orderDetail.tenNguoiNhan}
                  </p>
                  <p>
                    <span className="font-bold">SĐT:</span>{" "}
                    {orderDetail.sdtNguoiNhan}
                  </p>
                  <p>
                    <span className="font-bold">Địa chỉ:</span>{" "}
                    {orderDetail.diaChiGiaoHang}
                  </p>
                  {orderDetail.ghiChu && (
                    <p>
                      <span className="font-bold">Ghi chú:</span>{" "}
                      {orderDetail.ghiChu}
                    </p>
                  )}
                </div>

                {/* ======================================================== */}
                {/* 🎯 NÚT THEO DÕI LALAMOVE NẰM Ở ĐÂY (NỔI BẬT NHẤT) */}
                {/* ======================================================== */}
                {orderDetail.lalamoveTrackingUrl && (
                  <div className="mb-6 p-4 bg-orange-50 border border-orange-100 rounded-xl flex flex-col items-center sm:flex-row sm:justify-between gap-3 animate-fade-in shadow-inner">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl animate-bounce">🛵</span>
                      <div>
                        <p className="text-sm text-orange-800 font-black">
                          Tài xế đang giao hàng!
                        </p>
                        <p className="text-[11px] text-orange-600">
                          Theo dõi Shipper Lalamove trên bản đồ.
                        </p>
                      </div>
                    </div>
                    <a
                      href={orderDetail.lalamoveTrackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto text-center bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2 rounded-lg text-xs shadow-md transition active:scale-95 flex items-center justify-center gap-1"
                    >
                      📍 Mở Bản Đồ
                    </a>
                  </div>
                )}
                {/* ======================================================== */}

                <div className="border-t-2 border-dashed border-gray-200 pt-4 mb-4">
                  <p className="font-black text-gray-800 mb-3">
                    CHI TIẾT MÓN ({orderDetail.items.length})
                  </p>
                  <div className="space-y-4">
                    {orderDetail.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-start text-sm"
                      >
                        <div className="flex-1 pr-4">
                          <p className="font-bold text-gray-800">
                            {item.tenMon} (x{item.soLuong})
                          </p>
                          <div className="text-[11px] text-gray-500 mt-1 space-y-0.5">
                            <p>Size: {item.size}</p>
                            {item.isKhongNau && (
                              <p className="text-blue-500 font-bold uppercase">
                                🧊 Mang về tự nấu
                              </p>
                            )}
                            {item.rauCu && <p>🥬 Rau củ: {item.rauCu}</p>}
                            {item.toppings.map((t, i) => (
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
                        <p className="font-bold text-gray-800 whitespace-nowrap">
                          {formatVnd(item.thanhTien)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t-2 border-dashed border-gray-200 pt-4 space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Tạm tính:</span>
                    <span className="font-bold">
                      {formatVnd(orderDetail.tongTienHang)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Phí giao hàng:</span>
                    {orderDetail.phiGiaoHang === 0 ? (
                      <span className="font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded">
                        Miễn phí
                      </span>
                    ) : (
                      <span className="font-bold">
                        {formatVnd(orderDetail.phiGiaoHang)}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="font-black text-gray-800 text-lg">
                      TỔNG CỘNG:
                    </span>
                    <span className="font-black text-2xl text-green-600">
                      {formatVnd(orderDetail.thanhTien)}
                    </span>
                  </div>
                  <div className="text-center pt-4">
                    <span className="text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full uppercase">
                      Đã thanh toán: {orderDetail.phuongThucThanhToan}
                    </span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderHistoryPage;
