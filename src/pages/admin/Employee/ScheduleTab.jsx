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

const formatDateToYYYYMMDD = (date) => {
  const d = new Date(date);
  const month = "" + (d.getMonth() + 1);
  const day = "" + d.getDate();
  const year = d.getFullYear();
  return [year, month.padStart(2, "0"), day.padStart(2, "0")].join("-");
};

const ScheduleTab = () => {
  const [employees, setEmployees] = useState([]);
  const [shops, setShops] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [schedules, setSchedules] = useState([]);

  const [filterShopId, setFilterShopId] = useState("");
  const [searchEmpName, setSearchEmpName] = useState("");

  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(false);

  const authHeaders = useMemo(
    () => ({ Authorization: `Bearer ${getAdminToken()}` }),
    [],
  );

  const weekDays = useMemo(() => {
    const start = new Date(currentDate);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const next = new Date(start);
      next.setDate(start.getDate() + i);
      days.push(next);
    }
    return days;
  }, [currentDate]);

  useEffect(() => {
    const loadMasterData = async () => {
      try {
        const [resEmp, resShop, resShift] = await Promise.all([
          api.get("/admin/Employee", { headers: authHeaders }),
          api.get("/admin/ShopInfo", { headers: authHeaders }),
          api.get("/admin/Shift", { headers: authHeaders }),
        ]);

        setEmployees(
          Array.isArray(resEmp.data) ? resEmp.data : resEmp.data?.data || [],
        );
        setShops(
          Array.isArray(resShop.data) ? resShop.data : resShop.data?.data || [],
        );
        setShifts(
          Array.isArray(resShift.data)
            ? resShift.data
            : resShift.data?.data || [],
        );
      } catch (err) {
        toast.error("Lỗi tải dữ liệu cơ sở!");
      }
    };
    loadMasterData();
  }, [authHeaders]);

  useEffect(() => {
    const loadSchedule = async () => {
      try {
        setLoading(true);
        const startDate = formatDateToYYYYMMDD(weekDays[0]);
        const endDate = formatDateToYYYYMMDD(weekDays[6]);
        let url = `/admin/Schedule/get_schedule?startDate=${startDate}&endDate=${endDate}`;

        if (filterShopId) {
          url += `&shopId=${filterShopId}`;
        }

        const res = await api.get(url, { headers: authHeaders });
        setSchedules(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        toast.error("Lỗi tải lịch làm việc");
      } finally {
        setLoading(false);
      }
    };
    loadSchedule();
  }, [currentDate, filterShopId, authHeaders, weekDays]);

  const handlePrevWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const filteredEmployees = employees.filter((emp) => {
    const matchName = (emp.tenNhanVien || "")
      .toLowerCase()
      .includes(searchEmpName.toLowerCase());
    const matchShop = filterShopId
      ? String(emp.cuaHangId || emp.cuaHang?.shopId) === String(filterShopId)
      : true;
    return matchName && matchShop;
  });

  // --- API LƯU CA LÀM VIỆC ĐÃ UPDATE ---
  const handleAssignShift = async (
    employeeId,
    dateObj,
    shift1,
    shift2,
    shopId,
  ) => {
    const targetShopId = filterShopId
      ? parseInt(filterShopId)
      : parseInt(shopId) || 0;

    // Gom 2 ô thành mảng, lọc bỏ các ô đang trống (0)
    const shiftIds = [parseInt(shift1) || 0, parseInt(shift2) || 0].filter(
      (id) => id > 0,
    );
    const dayStr = formatDateToYYYYMMDD(dateObj);

    try {
      const payload = {
        TaiKhoanNoiBoId: employeeId,
        ShopId: targetShopId,
        NgayLamViec: dayStr,
        CaLamViecIds: shiftIds, // Gửi mảng danh sách Ca theo DTO mới
      };

      await api.post("/admin/Schedule/save", payload, { headers: authHeaders });
      toast.success("Đã cập nhật lịch làm việc!");

      // Update State Local giao diện
      setSchedules((prev) => {
        // Xóa hết các ca cũ của NV trong ngày đó
        const filtered = prev.filter(
          (s) =>
            !(
              s.taiKhoanNoiBoId === employeeId &&
              s.ngayLamViec?.startsWith(dayStr)
            ),
        );
        // Nhồi các ca mới vào
        shiftIds.forEach((id) => {
          filtered.push({
            taiKhoanNoiBoId: employeeId,
            caLamViecId: id,
            shopId: targetShopId,
            ngayLamViec: dayStr,
          });
        });
        return filtered;
      });
    } catch (err) {
      toast.error("Lỗi cập nhật lịch!");
      console.error(err);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-green-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          <select
            className="w-full sm:w-auto bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-green-500"
            value={filterShopId}
            onChange={(e) => setFilterShopId(e.target.value)}
          >
            <option value="">🏢 Toàn bộ Hệ thống</option>
            {shops.map((s) => (
              <option
                key={s.cuaHangId || s.shopId || s.id}
                value={s.cuaHangId || s.shopId || s.id}
              >
                {s.shopName}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="🔍 Nhập tên nhân viên..."
            className="w-full sm:w-64 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500"
            value={searchEmpName}
            onChange={(e) => setSearchEmpName(e.target.value)}
          />
        </div>

        <div className="flex items-center bg-gray-100 p-1 rounded-xl w-full sm:w-auto justify-center">
          <button
            onClick={handlePrevWeek}
            className="px-4 py-2 rounded-lg text-gray-500 hover:bg-white hover:shadow-sm font-bold"
          >
            ◀ Trước
          </button>
          <div className="px-6 py-2 font-black text-green-700 text-sm whitespace-nowrap">
            {weekDays[0].toLocaleDateString("vi-VN")} -{" "}
            {weekDays[6].toLocaleDateString("vi-VN")}
          </div>
          <button
            onClick={handleNextWeek}
            className="px-4 py-2 rounded-lg text-gray-500 hover:bg-white hover:shadow-sm font-bold"
          >
            Sau ▶
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-green-100 shadow-sm overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center font-bold text-green-600">
            Đang tải lịch...
          </div>
        )}

        <div className="overflow-x-auto pb-4">
          <table className="min-w-full text-left text-sm border-collapse">
            <thead className="bg-green-50">
              <tr>
                <th className="py-4 px-4 font-bold text-green-800 border-b border-r border-green-100 min-w-[200px] sticky left-0 bg-green-50 z-20 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                  Nhân viên
                </th>
                {weekDays.map((day, idx) => {
                  const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
                  const isToday =
                    formatDateToYYYYMMDD(day) ===
                    formatDateToYYYYMMDD(new Date());
                  return (
                    <th
                      key={idx}
                      className={`py-3 px-2 min-w-[120px] text-center border-b border-green-100 ${isToday ? "bg-green-200/50" : ""}`}
                    >
                      <div className="font-bold text-gray-700">
                        {dayNames[day.getDay()]}
                      </div>
                      <div className="text-xs text-gray-500">
                        {day.toLocaleDateString("vi-VN")}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredEmployees.map((emp) => (
                <tr
                  key={emp.taiKhoanNoiBoId || emp.id}
                  className="hover:bg-gray-50 align-top"
                >
                  <td className="py-3 px-4 border-r border-gray-100 sticky left-0 bg-white z-10 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                    <div className="font-bold text-gray-800">
                      {emp.tenNhanVien}
                    </div>
                    <div className="text-[10px] text-gray-500 mt-0.5">
                      {emp.cuaHang?.shopName || "Tổng công ty"}
                    </div>
                  </td>

                  {weekDays.map((day, idx) => {
                    const dayStr = formatDateToYYYYMMDD(day);

                    // Lấy ra TẤT CẢ các ca làm việc của NV trong ngày hôm nay
                    const dayShifts = schedules.filter(
                      (s) =>
                        s.taiKhoanNoiBoId === (emp.taiKhoanNoiBoId || emp.id) &&
                        s.ngayLamViec?.startsWith(dayStr),
                    );

                    // Gán vào 2 biến cho 2 ô (nếu mảng chỉ có 1 ca thì ô 2 sẽ trống)
                    const shift1 = dayShifts[0] ? dayShifts[0].caLamViecId : "";
                    const shift2 = dayShifts[1] ? dayShifts[1].caLamViecId : "";

                    return (
                      <td
                        key={idx}
                        className="py-2 px-2 text-center border-x border-gray-50"
                      >
                        <div className="flex flex-col gap-1.5">
                          {/* Ô CA 1 */}
                          <select
                            className={`w-full text-[11px] font-bold rounded-md p-1.5 cursor-pointer outline-none transition-colors
                              ${shift1 ? "bg-green-100 text-green-800 border border-green-300" : "bg-gray-50 text-gray-400 border border-transparent hover:bg-gray-100"}
                            `}
                            value={shift1}
                            onChange={(e) =>
                              handleAssignShift(
                                emp.taiKhoanNoiBoId || emp.id,
                                day,
                                e.target.value,
                                shift2,
                                emp.cuaHangId || emp.cuaHang?.shopId,
                              )
                            }
                          >
                            <option value="">-- Ca 1 --</option>
                            {shifts.map((shift) => (
                              <option key={shift.id} value={shift.id}>
                                {shift.tenCa || shift.TenCa}
                              </option>
                            ))}
                          </select>

                          {/* Ô CA 2 */}
                          <select
                            className={`w-full text-[11px] font-bold rounded-md p-1.5 cursor-pointer outline-none transition-colors
                              ${shift2 ? "bg-green-100 text-green-800 border border-green-300" : "bg-gray-50 text-gray-400 border border-transparent hover:bg-gray-100"}
                            `}
                            value={shift2}
                            onChange={(e) =>
                              handleAssignShift(
                                emp.taiKhoanNoiBoId || emp.id,
                                day,
                                shift1,
                                e.target.value,
                                emp.cuaHangId || emp.cuaHang?.shopId,
                              )
                            }
                          >
                            <option value="">-- Ca 2 --</option>
                            {shifts.map((shift) => (
                              <option key={shift.id} value={shift.id}>
                                {shift.tenCa || shift.TenCa}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}

              {filteredEmployees.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="py-8 text-center text-gray-500 bg-white z-10 relative"
                  >
                    Không tìm thấy nhân viên phù hợp với bộ lọc.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-right text-xs text-gray-400 italic">
        *Mẹo: Chọn "-- Ca 1 --" và "-- Ca 2 --" để cấp phép 2 ca trong cùng 1
        ngày. Để trống cả 2 ô tương đương với nghỉ phép.
      </div>
    </div>
  );
};

export default ScheduleTab;
