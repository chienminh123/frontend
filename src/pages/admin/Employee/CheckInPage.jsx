import React, { useState, useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import axiosClient from "../../../api/axiosClient";
import toast from "react-hot-toast";
import Swal from "sweetalert2";

const CheckInPage = () => {
  const [loading, setLoading] = useState(false);
  const [shifts, setShifts] = useState([]);
  const [selectedShift, setSelectedShift] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchShifts = async () => {
      try {
        const res = await axiosClient.get("/admin/Shift");
        if (Array.isArray(res.data)) {
          setShifts(res.data);
        }
      } catch (error) {
        console.warn(
          "Chưa có API lấy Ca Làm Việc, dùng dữ liệu mẫu (Fake Data)",
        );
        setShifts([
          { id: 1, tenCa: "Ca Hành Chính Sáng (7h30-11h30)" },
          { id: 2, tenCa: "Ca Hành Chính Chiều (13h30-17h30)" },
          { id: 3, tenCa: "Ca Sáng (6h-12h)" },
          { id: 4, tenCa: "Ca Chiều (13h-20h)" },
        ]);
      }
    };
    fetchShifts();
  }, []);

  useEffect(() => {
    if (!selectedShift) return;

    const scanner = new Html5QrcodeScanner("reader", {
      fps: 10,
      qrbox: { width: 250, height: 250 },
    });

    scanner.render(
      (decodedText) => {
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
  }, [selectedShift]);

  const handleCheckIn = (shopId) => {
    setLoading(true);

    const token = localStorage.getItem("token");
    if (!token) {
      // THÔNG BÁO LỖI CHƯA ĐĂNG NHẬP BẰNG SWEETALERT
      Swal.fire({
        title: "Lỗi bảo mật!",
        text: "Bạn chưa đăng nhập, vui lòng đăng nhập trước khi chấm công.",
        icon: "error",
        confirmButtonText: "Đăng nhập ngay",
        confirmButtonColor: "#22c55e",
        allowOutsideClick: false, // Bắt buộc phải bấm nút
      }).then(() => {
        navigate("/employee/login");
      });
      return;
    }

    let employeeId = null;
    try {
      const decoded = jwtDecode(token);
      employeeId =
        decoded[
          "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
        ] ||
        decoded.id ||
        decoded.Id;
    } catch (e) {
      Swal.fire({
        title: "Phiên hết hạn!",
        text: "Vui lòng đăng nhập lại!",
        icon: "warning",
        confirmButtonColor: "#22c55e",
      }).then(() => {
        navigate("/employee/login");
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await axiosClient.post("/admin/Check_In/check-in", {
            taiKhoanNoiBoId: parseInt(employeeId),
            caLamViecId: parseInt(selectedShift),
            latitude,
            longitude,
            shopId,
          });

          Swal.fire({
            title: "Chấm công Thành Công!",
            html: `<p style="font-size: 16px;">${res.data.message}</p>
                   <br/><b>Trạng thái: <span style="color: #16a34a; font-size: 18px;">${res.data.status}</span></b>`,
            icon: "success",
            confirmButtonText: "OK, Đã hiểu",
            confirmButtonColor: "#22c55e",
            allowOutsideClick: false,
          });

          setSelectedShift("");
        } catch (err) {
          const errorMsg =
            err.response?.data?.message ||
            err.response?.data ||
            "Có lỗi xảy ra, vui lòng thử lại!";
          Swal.fire({
            title: "Thất bại!",
            text: errorMsg,
            icon: "error",
            confirmButtonText: "Đóng",
            confirmButtonColor: "#ef4444",
            allowOutsideClick: false,
          });
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        Swal.fire({
          title: "Chưa bật GPS!",
          text: "Vui lòng cho phép trình duyệt truy cập Vị trí (GPS) để có thể chấm công!",
          icon: "warning",
          confirmButtonText: "OK",
          confirmButtonColor: "#eab308",
        });
        setLoading(false);
      },
    );
  };

  return (
    <div className="min-h-screen bg-green-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-6 border-t-4 border-green-500">
        <h2 className="text-2xl font-black text-center text-gray-800 mb-2">
          Điểm danh Check-in
        </h2>

        <div className="mb-6 mt-4">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            1. Bạn đang chấm công cho ca nào?
          </label>
          <select
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-700 font-medium cursor-pointer"
            value={selectedShift}
            onChange={(e) => setSelectedShift(e.target.value)}
          >
            <option value="">-- Bấm vào đây để chọn ca --</option>
            {shifts.map((shift) => (
              <option key={shift.id} value={shift.id}>
                {shift.tenCa || shift.TenCa}
              </option>
            ))}
          </select>
        </div>

        <label className="block text-sm font-bold text-gray-700 mb-2">
          2. Quét mã QR tại cửa hàng
        </label>

        {selectedShift ? (
          <div
            id="reader"
            className="w-full rounded-2xl overflow-hidden border-2 border-dashed border-green-300"
          ></div>
        ) : (
          <div className="w-full h-48 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center p-4 transition-all">
            <span className="text-4xl mb-2 opacity-30">📷</span>
            <p className="text-sm text-gray-400 font-medium">
              Camera sẽ tự động bật <br /> sau khi bạn chọn Ca làm việc
            </p>
          </div>
        )}

        {loading && (
          <p className="mt-4 text-center text-blue-500 font-bold animate-pulse">
            Đang tải dữ liệu GPS và chấm công...
          </p>
        )}
      </div>
    </div>
  );
};

export default CheckInPage;
