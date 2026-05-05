import React, { useEffect, useState } from "react";
import clientAccountApi from "../../api/clientAccountApi";

const InfoRow = ({ label, value }) => (
  <div className="flex items-center justify-between gap-4 py-3 border-b border-gray-100 last:border-b-0">
    <span className="text-sm font-bold text-gray-500">{label}</span>
    <span className="text-sm font-black text-gray-900 text-right break-words">
      {value}
    </span>
  </div>
);

const AccountPage = () => {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await clientAccountApi.me();
        if (!alive) return;
        setMe(data);
      } catch (e) {
        if (!alive) return;
        setError(
          e?.response?.data?.message ||
            e?.message ||
            "Không thể tải thông tin cá nhân.",
        );
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    };
    load();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 animate-fade-in">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-green-50 border border-green-100 text-green-700 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest">
          Tài khoản
        </div>
        <h2 className="text-3xl md:text-4xl font-black text-gray-800 tracking-tight mt-4">
          Thông tin <span className="text-green-600">cá nhân</span>
        </h2>
        <p className="text-gray-500 mt-2">
          Xem điểm đã tích, thông tin liên hệ và lịch sử đặt hàng.
        </p>
      </div>

      {loading && (
        <div className="bg-white rounded-[2.5rem] border border-green-50 p-10 text-center shadow-sm">
          <div className="text-5xl mb-3 animate-pulse">👤</div>
          <p className="font-black text-gray-800">Đang tải thông tin...</p>
        </div>
      )}

      {!loading && error && (
        <div className="bg-white rounded-[2.5rem] border border-red-100 p-10 text-center shadow-sm">
          <div className="text-5xl mb-3">⚠️</div>
          <p className="font-black text-red-600">{error}</p>
          <p className="text-sm text-gray-500 mt-2">
            Bạn hãy đăng nhập lại nếu phiên đã hết hạn.
          </p>
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-[2.5rem] border border-green-50 p-6 shadow-sm lg:col-span-1">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-green-100 border border-green-200 flex items-center justify-center font-black text-green-700 text-2xl">
                {(me?.tenKhachHang || "K").charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-lg font-black text-gray-900 truncate">
                  {me?.tenKhachHang || "-"}
                </p>
                <p className="text-sm font-bold text-green-700">
                  {Number(me?.tichDiem || 0).toLocaleString("vi-VN")} điểm
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-gray-100 p-6 shadow-sm lg:col-span-2">
            <InfoRow label="Số điện thoại" value={me?.sdt || "-"} />
            <InfoRow label="Email" value={me?.email || "-"} />
            <InfoRow label="Hạng tài khoản" value={me?.role || "Customer"} />
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountPage;

