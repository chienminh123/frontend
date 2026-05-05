import React, { useEffect, useState } from "react";
import clientAccountApi from "../../api/clientAccountApi";

const PointsPage = () => {
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
            "Không thể tải điểm tích lũy.",
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
        <div className="inline-flex items-center gap-2 bg-yellow-50 border border-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest">
          Điểm tích lũy
        </div>
        <h2 className="text-3xl md:text-4xl font-black text-gray-800 tracking-tight mt-4">
          Điểm đã <span className="text-green-600">tích</span>
        </h2>
        <p className="text-gray-500 mt-2">
          Điểm sẽ được cộng sau mỗi đơn hàng hoàn tất.
        </p>
      </div>

      {loading && (
        <div className="bg-white rounded-[2.5rem] border border-green-50 p-10 text-center shadow-sm">
          <div className="text-5xl mb-3 animate-pulse">⭐</div>
          <p className="font-black text-gray-800">Đang tải điểm...</p>
        </div>
      )}

      {!loading && error && (
        <div className="bg-white rounded-[2.5rem] border border-red-100 p-10 text-center shadow-sm">
          <div className="text-5xl mb-3">⚠️</div>
          <p className="font-black text-red-600">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-green-500/20">
          <p className="text-xs font-black uppercase tracking-widest text-white/75">
            Điểm hiện tại
          </p>
          <p className="text-5xl font-black mt-2">
            {Number(me?.tichDiem || 0).toLocaleString("vi-VN")}
          </p>
          <p className="text-white/90 mt-3">
            Tích điểm để nhận ưu đãi, voucher và quà tặng thành viên.
          </p>
        </div>
      )}
    </div>
  );
};

export default PointsPage;

