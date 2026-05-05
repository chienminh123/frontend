import React, { useState, useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import axiosClient from "../../api/axiosClient";
import toast from "react-hot-toast";

const CheckInPage = () => {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner("reader", {
      fps: 10,
      qrbox: { width: 250, height: 250 },
    });

    scanner.render(
      (decodedText) => {
        // Giả sử mã QR dán ở quán có nội dung: {"shopId": 1}
        try {
          const qrData = JSON.parse(decodedText);
          scanner.clear();
          handleCheckIn(qrData.shopId);
        } catch (e) {
          toast.error("Mã QR không hợp lệ!");
        }
      },
      (err) => {},
    );

    return () => scanner.clear();
  }, []);

  const handleCheckIn = (shopId) => {
    setLoading(true);
    // 1. Lấy tọa độ GPS người dùng
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await axiosClient.post("/admin/Attendance/check-in", {
            taiKhanNoiBoId: 1, // Bạn lấy từ user logged in nhé
            caLamViecId: 1, // Tạm thời để 1, sau này sẽ chọn ca
            latitude,
            longitude,
            shopId, // Gửi kèm ShopId để Backend check đúng vị trí quán đó
          });
          toast.success("Chấm công thành công!");
        } catch (err) {
          toast.error(err.response?.data || "Lỗi chấm công!");
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        toast.error("Vui lòng bật định vị để chấm công!");
        setLoading(false);
      },
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center">
      <h2 className="text-2xl font-bold text-green-600 mb-4 mt-10">
        Chấm Công Cửa Hàng
      </h2>
      <div
        id="reader"
        className="w-full max-w-sm bg-white rounded-2xl overflow-hidden shadow-lg border-4 border-green-500"
      ></div>
      <p className="mt-4 text-gray-500 italic">
        Quét mã QR tại quầy để điểm danh
      </p>
      {loading && (
        <p className="mt-2 text-blue-500 font-bold">Đang xác thực vị trí...</p>
      )}
    </div>
  );
};

export default CheckInPage;
