import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import toast from "react-hot-toast";

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

// Hàm 1: Định dạng số thành chuỗi có dấu chấm (VD: 1000000 -> 1.000.000)
const formatCurrency = (value) => {
  if (!value) return "";
  // Xóa toàn bộ các ký tự không phải là số
  const digits = value.toString().replace(/\D/g, "");
  // Thêm dấu chấm phân cách hàng nghìn
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

// Hàm 2: Biến chuỗi có dấu chấm ngược lại thành số để lưu vào Database (VD: 1.000.000 -> 1000000)
const parseCurrency = (value) => {
  if (!value) return 0;
  const digits = value.toString().replace(/\D/g, "");
  return parseInt(digits, 10) || 0;
};

const PayrollTab = () => {
  const [activeTab, setActiveTab] = useState("bang_luong"); // 'bang_luong' hoặc 'cau_hinh'
  const [loading, setLoading] = useState(false);

  // States Cấu hình lương
  const [employees, setEmployees] = useState([]);
  const [configs, setConfigs] = useState([]);
  const [editConfig, setEditConfig] = useState(null);

  // States Bảng lương
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [payrolls, setPayrolls] = useState([]);

  const authHeaders = useMemo(
    () => ({ Authorization: `Bearer ${getAdminToken()}` }),
    [],
  );

  // TẢI DỮ LIỆU
  useEffect(() => {
    const loadInitData = async () => {
      try {
        const [resEmp, resConf] = await Promise.all([
          api.get("/admin/Employee", { headers: authHeaders }),
          api.get("/admin/Payroll/config", { headers: authHeaders }),
        ]);
        setEmployees(
          Array.isArray(resEmp.data) ? resEmp.data : resEmp.data?.data || [],
        );
        setConfigs(Array.isArray(resConf.data) ? resConf.data : []);
      } catch (err) {
        console.error(err);
      }
    };
    loadInitData();
  }, [authHeaders]);

  const loadPayrolls = async () => {
    try {
      setLoading(true);
      const res = await api.get(
        `/admin/Payroll/list?thang=${month}&nam=${year}`,
        { headers: authHeaders },
      );
      setPayrolls(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast.error("Lỗi tải bảng lương");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "bang_luong") {
      loadPayrolls();
    }
  }, [month, year, activeTab, authHeaders]);

  // --- LOGIC CẤU HÌNH LƯƠNG ---
  const handleSaveConfig = async (e) => {
    e.preventDefault();
    if (!editConfig) return;
    try {
      setLoading(true);
      await api.post("/admin/Payroll/config", editConfig, {
        headers: authHeaders,
      });
      toast.success("Đã lưu cấu hình lương!");

      // Reload cấu hình
      const resConf = await api.get("/admin/Payroll/config", {
        headers: authHeaders,
      });
      setConfigs(Array.isArray(resConf.data) ? resConf.data : []);
      setEditConfig(null);
    } catch (err) {
      toast.error("Lỗi lưu cấu hình");
    } finally {
      setLoading(false);
    }
  };

  // --- LOGIC TÍNH LƯƠNG ---
  const handleCalculatePayroll = async () => {
    if (
      !window.confirm(
        `Bạn có chắc muốn chốt dữ liệu và tính lương cho tháng ${month}/${year}?`,
      )
    )
      return;
    try {
      setLoading(true);
      const res = await api.post(
        `/admin/Payroll/calculate?thang=${month}&nam=${year}`,
        {},
        { headers: authHeaders },
      );
      toast.success(res.data.message || "Đã tính xong lương!");
      loadPayrolls(); // Load lại bảng lương
    } catch (err) {
      toast.error(err.response?.data || "Lỗi tính lương");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async (id) => {
    if (!window.confirm("Đánh dấu đã thanh toán lương cho nhân viên này?"))
      return;
    try {
      setLoading(true);
      await api.put(`/admin/Payroll/pay/${id}`, {}, { headers: authHeaders });
      toast.success("Thanh toán thành công!");
      loadPayrolls();
    } catch (err) {
      toast.error("Lỗi cập nhật trạng thái");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl animate-fade-in font-sans">
      {/* HEADER & TABS CỤC BỘ */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-green-100">
        <div className="flex bg-gray-100 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setActiveTab("bang_luong")}
            className={`flex-1 sm:px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "bang_luong" ? "bg-white text-green-600 shadow-sm" : "text-gray-500 hover:text-green-500"}`}
          >
            Bảng lương tháng
          </button>
          <button
            onClick={() => setActiveTab("cau_hinh")}
            className={`flex-1 sm:px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "cau_hinh" ? "bg-white text-green-600 shadow-sm" : "text-gray-500 hover:text-green-500"}`}
          >
            Cấu hình mức lương
          </button>
        </div>
      </div>

      {/* GIAO DIỆN BẢNG LƯƠNG */}
      {activeTab === "bang_luong" && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-green-100 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="font-bold text-gray-700">Xem lương tháng:</div>
              <select
                className="border border-gray-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-green-500 font-semibold"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                  <option key={m} value={m}>
                    Tháng {m}
                  </option>
                ))}
              </select>
              <select
                className="border border-gray-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-green-500 font-semibold"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              >
                {[2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>
                    Năm {y}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleCalculatePayroll}
              disabled={loading}
              className="px-5 py-2.5 bg-yellow-400 text-yellow-900 font-bold rounded-xl shadow-sm hover:bg-yellow-500 transition"
            >
              🔄 Bấm để Tính lương Tháng {month}
            </button>
          </div>

          <div className="rounded-2xl bg-white border border-green-100 overflow-hidden shadow-sm">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase font-bold text-green-700 bg-green-50 border-b border-green-100">
                <tr>
                  <th className="py-3 px-4">Nhân viên</th>
                  <th className="py-3 px-4 text-center">Giờ làm (Giờ)</th>
                  <th className="py-3 px-4 text-center">Ngày làm (Cố định)</th>
                  <th className="py-3 px-4 text-right">Phạt đi muộn</th>
                  <th className="py-3 px-4 text-right">Phụ cấp</th>
                  <th className="py-3 px-4 text-right text-green-700">
                    Thực lãnh
                  </th>
                  <th className="py-3 px-4 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payrolls.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-bold text-gray-800">
                      {p.tenNhanVien}
                    </td>
                    <td className="py-3 px-4 text-center text-gray-600 font-mono">
                      {p.tongGioLam}h
                    </td>
                    <td className="py-3 px-4 text-center text-gray-600 font-mono">
                      {p.tongNgayLam} ngày
                    </td>
                    <td className="py-3 px-4 text-right text-red-500 font-semibold">
                      - {p.tienPhatDiMuon?.toLocaleString()}đ
                    </td>
                    <td className="py-3 px-4 text-right text-blue-600 font-semibold">
                      + {p.tongPhuCap?.toLocaleString()}đ
                    </td>
                    <td className="py-3 px-4 text-right font-black text-green-600 text-base">
                      {p.tongTienNhan?.toLocaleString()}đ
                    </td>
                    <td className="py-3 px-4 text-center">
                      {p.trangThai === "DA_THANH_TOAN" ? (
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded font-bold text-xs">
                          Đã Trả
                        </span>
                      ) : (
                        <button
                          onClick={() => handleMarkAsPaid(p.id)}
                          className="bg-orange-100 hover:bg-orange-200 text-orange-700 px-2 py-1 rounded font-bold text-xs transition"
                        >
                          Thanh toán
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {payrolls.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-8 text-center text-gray-500 italic"
                    >
                      Chưa có bảng lương tháng này. Hãy bấm nút "Tính lương" ở
                      trên.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 italic text-right">
            *Công thức (Giờ): (Giờ làm * Mức Lương) + Phụ cấp - Phạt | Công thức
            (Cố định): (Lương Cứng / 26 * Ngày làm) + Phụ cấp - Phạt
          </p>
        </div>
      )}

      {/* GIAO DIỆN CẤU HÌNH LƯƠNG */}
      {activeTab === "cau_hinh" && (
        <div className="grid gap-6 md:grid-cols-[1fr,350px]">
          <div className="rounded-2xl bg-white border border-green-100 overflow-hidden shadow-sm">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase font-bold text-green-700 bg-green-50 border-b border-green-100">
                <tr>
                  <th className="py-3 px-4">Nhân viên</th>
                  <th className="py-3 px-4">Loại lương</th>
                  <th className="py-3 px-4 text-right">Mức lương (đ)</th>
                  <th className="py-3 px-4 text-right">Phụ cấp (đ)</th>
                  <th className="py-3 px-4 text-center">Sửa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {employees.map((emp) => {
                  const cfg = configs.find(
                    (c) =>
                      c.taiKhoanNoiBoId === (emp.taiKhoanNoiBoId || emp.id),
                  );

                  // Tính tổng 3 loại phụ cấp để hiển thị ra bảng (Nếu chưa cài đặt thì mặc định là 0)
                  const tongPhuCap = cfg
                    ? (cfg.phuCapAnTrua || 0) +
                      (cfg.phuCapXangXe || 0) +
                      (cfg.phuCapChuyenCan || 0)
                    : 0;

                  return (
                    <tr
                      key={emp.taiKhoanNoiBoId || emp.id}
                      className="hover:bg-gray-50"
                    >
                      <td className="py-3 px-4 font-bold text-gray-800">
                        {emp.tenNhanVien}
                      </td>
                      <td className="py-3 px-4">
                        {cfg ? (
                          cfg.loaiLuong === "THEO_GIO" ? (
                            <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-semibold text-xs">
                              Theo giờ
                            </span>
                          ) : (
                            <span className="text-purple-600 bg-purple-50 px-2 py-0.5 rounded font-semibold text-xs">
                              Lương cứng
                            </span>
                          )
                        ) : (
                          <span className="text-gray-400 text-xs italic">
                            Chưa cài đặt
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-gray-700">
                        {cfg ? cfg.mucLuong?.toLocaleString() : "---"}
                      </td>

                      {/* Hiển thị tổng phụ cấp có dấu chấm */}
                      <td className="py-3 px-4 text-right font-semibold text-gray-700">
                        {cfg ? tongPhuCap.toLocaleString() : "---"}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() =>
                            setEditConfig({
                              TaiKhoanNoiBoId: emp.taiKhoanNoiBoId || emp.id,
                              TenNhanVien: emp.tenNhanVien,
                              LoaiLuong: cfg?.loaiLuong || "THEO_GIO",
                              MucLuong: cfg?.mucLuong || 0,
                              PhuCapAnTrua: cfg?.phuCapAnTrua || 0,
                              PhuCapXangXe: cfg?.phuCapXangXe || 0,
                              PhuCapChuyenCan: cfg?.phuCapChuyenCan || 0,
                            })
                          }
                          className="text-green-600 font-bold hover:underline"
                        >
                          Thiết lập
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Form Cập nhật Cấu hình */}
          <div className="rounded-2xl bg-white border border-green-100 p-5 shadow-sm h-fit">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              ⚙️ Thiết lập mức lương
            </h3>
            {editConfig ? (
              <form onSubmit={handleSaveConfig} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    Nhân viên
                  </label>
                  <input
                    type="text"
                    readOnly
                    className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold text-gray-700"
                    value={editConfig.TenNhanVien}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    Kiểu tính lương
                  </label>
                  <select
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-green-500"
                    value={editConfig.LoaiLuong}
                    onChange={(e) =>
                      setEditConfig({
                        ...editConfig,
                        LoaiLuong: e.target.value,
                      })
                    }
                  >
                    <option value="THEO_GIO">
                      Lương theo giờ (Dành cho Nhân viên bán hàng)
                    </option>
                    <option value="CO_DINH">
                      Lương cứng tháng (Dành cho Nhân viên văn phòng)
                    </option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    Mức lương cơ bản (VNĐ)
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 font-bold text-blue-600"
                    // 1. Hiển thị: Định dạng số có dấu chấm
                    value={formatCurrency(editConfig.MucLuong)}
                    // 2. Lưu trữ: Ép ngược về số nguyên
                    onChange={(e) =>
                      setEditConfig({
                        ...editConfig,
                        MucLuong: parseCurrency(e.target.value),
                      })
                    }
                  />
                  <p className="text-[10px] text-gray-400 mt-1 italic">
                    {editConfig.LoaiLuong === "THEO_GIO"
                      ? "VD: 25.000đ / 1 giờ"
                      : "VD: 8.000.000đ / 1 tháng"}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
                      Cơm trưa (VNĐ/tháng)
                    </label>
                    <input
                      type="text"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 font-bold text-gray-700"
                      value={formatCurrency(editConfig.PhuCapAnTrua)}
                      onChange={(e) =>
                        setEditConfig({
                          ...editConfig,
                          PhuCapAnTrua: parseCurrency(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
                      Xăng xe (VNĐ/tháng)
                    </label>
                    <input
                      type="text"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 font-bold text-gray-700"
                      value={formatCurrency(editConfig.PhuCapXangXe)}
                      onChange={(e) =>
                        setEditConfig({
                          ...editConfig,
                          PhuCapXangXe: parseCurrency(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1 flex justify-between">
                      <span>Thưởng Chuyên cần (VNĐ/tháng)</span>
                      <span className="text-orange-500 italic">
                        *Mất 100% nếu nghỉ/đi muộn
                      </span>
                    </label>
                    <input
                      type="text"
                      className="w-full border border-orange-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 font-bold text-orange-600 bg-orange-50"
                      value={formatCurrency(editConfig.PhuCapChuyenCan)}
                      onChange={(e) =>
                        setEditConfig({
                          ...editConfig,
                          PhuCapChuyenCan: parseCurrency(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-green-500 text-white font-bold py-2 rounded-xl hover:bg-green-600"
                  >
                    Lưu
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditConfig(null)}
                    className="px-4 bg-gray-200 text-gray-700 font-bold py-2 rounded-xl hover:bg-gray-300"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-10 text-gray-400 text-sm">
                Bấm "Thiết lập" ở bảng bên cạnh để cài đặt lương cho nhân viên.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollTab;
