import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: { Accept: "application/json" },
});
const getAdminToken = () =>
  window.localStorage.getItem("adminToken") ||
  window.localStorage.getItem("token") ||
  "";
api.interceptors.request.use((config) => {
  const token = getAdminToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Hàm lấy ngày đầu tuần và cuối tuần hiện tại
const getStartAndEndOfWeek = () => {
  const curr = new Date();
  const first = curr.getDate() - curr.getDay() + 1;
  const last = first + 6;

  const startDate = new Date(curr.setDate(first)).toISOString().split("T")[0];
  const endDate = new Date(curr.setDate(last)).toISOString().split("T")[0];
  return { startDate, endDate };
};

const AttendanceHistoryTab = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  // Bộ lọc
  const defaultDates = getStartAndEndOfWeek();
  const [startDate, setStartDate] = useState(defaultDates.startDate);
  const [endDate, setEndDate] = useState(defaultDates.endDate);
  const [searchName, setSearchName] = useState("");

  const authHeaders = useMemo(
    () => ({ Authorization: `Bearer ${getAdminToken()}` }),
    [],
  );

  const loadHistory = async () => {
    try {
      setLoading(true);
      const res = await api.get(
        `/admin/Check_In/get_history?startDate=${startDate}&endDate=${endDate}`,
        { headers: authHeaders },
      );
      setHistory(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Lỗi tải lịch sử chấm công", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [startDate, endDate, authHeaders]);

  const filteredHistory = history.filter((h) =>
    (h.tenNhanVien || "").toLowerCase().includes(searchName.toLowerCase()),
  );

  // LOGIC TÔ MÀU TRẠNG THÁI TỰ ĐỘNG
  const getStatusColor = (status) => {
    if (!status) return "bg-gray-100 text-gray-600";
    const s = status.toLowerCase();

    if (s.includes("đúng giờ")) {
      return "bg-green-100 text-green-700 border-green-200"; // Màu xanh lá
    }
    if (s.includes("muộn") || s.includes("sớm")) {
      return "bg-yellow-100 text-yellow-700 border-yellow-200"; // Màu vàng
    }
    if (s.includes("nghỉ") || s.includes("vắng")) {
      return "bg-red-100 text-red-700 border-red-200"; // Màu đỏ
    }
    return "bg-gray-100 text-gray-600 border-gray-200";
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* THANH TÌM KIẾM VÀ BỘ LỌC */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-green-100 flex flex-col md:flex-row gap-4 items-end md:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">
              Từ ngày
            </label>
            <input
              type="date"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">
              Đến ngày
            </label>
            <input
              type="date"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="space-y-1 flex-1">
            <label className="text-xs font-bold text-gray-500 uppercase">
              Tên nhân viên
            </label>
            <input
              type="text"
              placeholder="Gõ tên để lọc..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
            />
          </div>
        </div>

        <button
          onClick={loadHistory}
          disabled={loading}
          className="px-6 py-2.5 bg-green-500 text-white font-bold rounded-xl shadow-sm hover:bg-green-600 disabled:opacity-60 transition whitespace-nowrap"
        >
          {loading ? "Đang tải..." : "🔄 Làm mới"}
        </button>
      </div>

      {/* BẢNG DỮ LIỆU THỰC TẾ */}
      <div className="rounded-2xl bg-white border border-green-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto text-sm">
          <table className="min-w-full text-left">
            <thead className="text-xs uppercase font-bold text-green-800 bg-green-50 border-b border-green-100">
              <tr>
                <th className="py-3 px-4">Ngày</th>
                <th className="py-3 px-4">Nhân viên</th>
                <th className="py-3 px-4">Ca làm việc</th>
                <th className="py-3 px-4">Giờ Vào</th>
                <th className="py-3 px-4">Giờ Ra</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4">Ghi chú GPS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredHistory.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition">
                  <td className="py-3 px-4 font-semibold text-gray-600">
                    {item.ngay ? item.ngay.slice(0, 10) : ""}
                  </td>
                  <td className="py-3 px-4 font-bold text-gray-800">
                    {item.tenNhanVien}
                  </td>
                  <td className="py-3 px-4 text-blue-600 font-semibold">
                    {item.tenCa}
                  </td>
                  <td className="py-3 px-4 font-mono text-gray-600">
                    {item.gioVao
                      ? new Date(item.gioVao).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "--:--"}
                  </td>
                  <td className="py-3 px-4 font-mono text-gray-600">
                    {item.gioRa
                      ? new Date(item.gioRa).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "--:--"}
                  </td>
                  <td className="py-3 px-4">
                    {/* KHỐI HIỂN THỊ MÀU TRẠNG THÁI */}
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${getStatusColor(item.trangThai)}`}
                    >
                      {item.trangThai || "Chưa xác định"}
                    </span>
                  </td>
                  <td
                    className="py-3 px-4 text-xs text-gray-500 italic max-w-[200px] truncate"
                    title={item.ghiChu}
                  >
                    {item.ghiChu}
                  </td>
                </tr>
              ))}

              {filteredHistory.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    Không có dữ liệu chấm công nào trong khoảng thời gian này.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AttendanceHistoryTab;
