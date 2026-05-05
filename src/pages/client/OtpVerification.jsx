import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import toast, { Toaster } from "react-hot-toast";

const OtpVerification = () => {
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(60); // Bộ đếm ngược 60 giây
  const [resendCount, setResendCount] = useState(0); // Theo dõi số lần gửi lại
  const MAX_RESEND = 3; // Giới hạn tối đa 3 lần
  const [canResend, setCanResend] = useState(false);
  const navigate = useNavigate();
  const [registerData, setRegisterData] = useState(null);

  // 1. Lấy dữ liệu từ localStorage
  useEffect(() => {
    const data = localStorage.getItem("registerData");
    if (!data) {
      toast.error("Không có dữ liệu đăng ký. Vui lòng quay lại đăng ký.");
      navigate("/login");
      return;
    }
    setRegisterData(JSON.parse(data));
  }, [navigate]);

  // 2. Logic đếm ngược
  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // 3. Hàm gửi lại OTP
  const handleResendOtp = async () => {
    if (resendCount >= MAX_RESEND) {
      toast.error(
        "Bạn đã thử lại quá nhiều lần. Vui lòng quay lại sau 15 phút!",
      );
      return;
    }

    setLoading(true);
    try {
      await axiosClient.post("/client/auth/send-otp", registerData);

      toast.success(
        `Mã OTP mới đã được gửi đến email của bạn!(Lần ${resendCount + 1}/${MAX_RESEND})`,
      );
      setResendCount((prev) => prev + 1);
      setTimer(60); // Reset lại 60 giây
      setCanResend(false);
      setOtpCode(""); // Xóa mã cũ người dùng đang nhập dở
    } catch (err) {
      toast.error(err.response?.data || "Không thể gửi lại mã!");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!otpCode) {
      toast.error("Vui lòng nhập mã OTP!");
      return;
    }
    setLoading(true);
    try {
      const dataToSend = { ...registerData, OtpCode: otpCode };
      const res = await axiosClient.post("/client/auth/register", dataToSend);
      toast.success(res.data.Message);
      localStorage.removeItem("registerData");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data || "Lỗi xác nhận OTP!");
    } finally {
      setLoading(false);
    }
  };

  if (!registerData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Toaster />
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-center text-green-600 mb-6">
          Xác nhận mã OTP
        </h2>
        <p className="text-center text-gray-600 mb-4">
          Mã OTP đã được gửi đến email: <br />
          <span className="font-semibold text-gray-800">
            {registerData.Email}
          </span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Mã OTP:
            </label>
            <input
              type="text"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              placeholder="Nhập mã 6 chữ số"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 text-center text-xl tracking-widest"
              required
            />
          </div>

          {/* Phần hiển thị Timer và nút Gửi lại */}
          <div className="text-center">
            {timer > 0 ? (
              <p className="text-sm text-gray-500">
                Gửi lại mã sau{" "}
                <span className="text-green-600 font-bold">{timer}s</span>
              </p>
            ) : resendCount < MAX_RESEND ? (
              <button type="button" onClick={handleResendOtp} className="...">
                Gửi lại mã OTP
              </button>
            ) : (
              <p className="text-sm text-red-500 font-medium italic">
                Đã chạm giới hạn gửi lại mã.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 font-bold"
          >
            {loading ? "Đang xử lý..." : "Xác nhận đăng ký"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/login")}
            className="w-full bg-gray-400 text-white py-2 px-4 rounded-md hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors"
          >
            Quay lại
          </button>
        </form>
      </div>
    </div>
  );
};

export default OtpVerification;
