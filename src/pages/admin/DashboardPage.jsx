import React, { useEffect, useState, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ComposedChart,
} from "recharts";

// ==========================================
// 1. CẤU HÌNH API & TOKEN
// ==========================================
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

const DashboardPage = () => {
  const outletContext = useOutletContext();
  const user = outletContext?.user || {};
  const role = user?.role || "Admin";

  // ==========================================
  // 2. CẤU HÌNH TABS & QUYỀN TRUY CẬP
  // ==========================================
  const chartTabs = [
    {
      id: "van-hanh",
      label: "📊 Vận hành kinh doanh",
      roles: ["Admin", "StoreManager", "AreaManager"],
    },
    {
      id: "ke-toan",
      label: "💰 Tài chính & Kế toán",
      roles: ["Admin", "Accountant"],
    },
    { id: "nhan-su", label: "🧑‍🍳 Nhân sự & Chấm công", roles: ["Admin", "HR"] },
    {
      id: "san-xuat",
      label: "📦 Sản xuất & Kho",
      roles: ["Admin", "Production"],
    },
  ];

  const allowedTabs = chartTabs.filter((tab) => tab.roles.includes(role));
  const [activeTab, setActiveTab] = useState(allowedTabs[0]?.id || "van-hanh");

  const COLORS = ["#22C55E", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6"];
  const formatVN = (value) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);

  // ==========================================
  // 3. STATE CHỨA REAL DATA TỪ BACKEND
  // ==========================================
  const [loadingReports, setLoadingReports] = useState(false);
  const [reportData, setReportData] = useState({
    doanhThuChiNhanh: [],
    loaiDonHang: [],
    thuChi: [],
    nhanSu: [],
    tonKho: [],
  });

  const authHeaders = useMemo(() => {
    const token = getAdminToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  // ==========================================
  // 4. HÀM KÉO DỮ LIỆU TỪ CÁC API VỪA VIẾT
  // ==========================================
  const fetchReportData = async () => {
    try {
      setLoadingReports(true);

      // Bước 1: Lấy danh sách ShopId để làm tham số truyền vào API Báo Cáo
      const shopRes = await api.get("/admin/ShopInfo", {
        headers: authHeaders,
      });
      const shops = Array.isArray(shopRes.data)
        ? shopRes.data
        : shopRes.data?.data || shopRes.data?.shops || [];
      const shopIds = shops.map((s) => s.shopId || s.cuaHangId || s.id);

      if (shopIds.length === 0) return;

      // Bước 2: Setup ngày lấy báo cáo (Mặc định 30 ngày gần nhất)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 30);

      const payload = {
        StartDate: startDate.toISOString(),
        EndDate: endDate.toISOString(),
        ShopIds: shopIds,
      };

      // Bước 3: Gọi đồng loạt 5 API C# để lấy data (Tốc độ bàn thờ)
      const [resDoanhThuCN, resTyLeDon, resThuChi, resNhanSu, resTonKho] =
        await Promise.all([
          api.post("/admin/BaoCao/doanh-thu-chi-nhanh", payload, {
            headers: authHeaders,
          }),
          api.post("/admin/BaoCao/ty-le-don-hang", payload, {
            headers: authHeaders,
          }),
          api.post("/admin/BaoCao/thu-chi-theo-ngay", payload, {
            headers: authHeaders,
          }),
          api.get("/admin/BaoCao/nhan-su-chuc-vu", { headers: authHeaders }), // Riêng cái này là GET
          api.post("/admin/BaoCao/canh-bao-ton-kho", payload, {
            headers: authHeaders,
          }),
        ]);

      // Bước 4: Nhét data thật vào State để Render
      setReportData({
        doanhThuChiNhanh: resDoanhThuCN.data,
        loaiDonHang: resTyLeDon.data,
        thuChi: resThuChi.data,
        nhanSu: resNhanSu.data,
        tonKho: resTonKho.data,
      });
    } catch (error) {
      console.error("Lỗi khi kéo báo cáo từ C#:", error);
    } finally {
      setLoadingReports(false);
    }
  };

  // Tự động gọi API khi vào trang
  useEffect(() => {
    fetchReportData();
  }, []);

  // ==========================================
  // 5. CÁC HÀM VẼ BIỂU ĐỒ THEO CHỨC VỤ
  // ==========================================

  const renderVanHanh = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
      <div className="bg-white p-6 rounded-3xl border border-green-100 shadow-sm">
        <h3 className="font-bold text-gray-800 mb-6">
          📊 So sánh doanh thu các chi nhánh (30 ngày)
        </h3>
        <div className="h-[300px] w-full">
          {reportData.doanhThuChiNhanh.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={reportData.doanhThuChiNhanh}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={true}
                  vertical={false}
                />
                <XAxis
                  type="number"
                  tickFormatter={(val) => `${val / 1000000}Tr`}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={120}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip formatter={(value) => formatVN(value)} />
                <Bar
                  dataKey="doanhThu"
                  name="Doanh thu"
                  fill="#22C55E"
                  radius={[0, 6, 6, 0]}
                  barSize={30}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 italic text-center mt-20">
              Chưa có dữ liệu bán hàng
            </p>
          )}
        </div>
      </div>
      <div className="bg-white p-6 rounded-3xl border border-green-100 shadow-sm">
        <h3 className="font-bold text-gray-800 mb-6">
          🍕 Tỷ trọng đơn hàng Tại quầy vs Online
        </h3>
        <div className="h-[300px] w-full">
          {reportData.loaiDonHang.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={reportData.loaiDonHang}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                  label
                >
                  {reportData.loaiDonHang.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 italic text-center mt-20">
              Chưa có dữ liệu đơn hàng
            </p>
          )}
        </div>
      </div>
    </div>
  );

  const renderKeToan = () => {
    // Tính cơ cấu chi phí từ hàm thuChi
    const tongChiPhi = reportData.thuChi.reduce(
      (sum, item) => sum + item.chiPhi,
      0,
    );
    const tongDoanhThu = reportData.thuChi.reduce(
      (sum, item) => sum + item.doanhThu,
      0,
    );
    const dataCoCauThuChi = [
      { name: "Tổng Doanh Thu", value: tongDoanhThu },
      { name: "Tổng Chi Phí", value: tongChiPhi },
    ];

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
        <div className="bg-white p-6 rounded-3xl border border-blue-100 shadow-sm lg:col-span-2">
          <h3 className="font-bold text-gray-800 mb-6">
            📈 Xu hướng Dòng tiền (Doanh Thu vs Chi Phí)
          </h3>
          <div className="h-[350px] w-full">
            {reportData.thuChi.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={reportData.thuChi}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="ngay" />
                  <YAxis tickFormatter={(val) => `${val / 1000000}M`} />
                  <Tooltip formatter={(value) => formatVN(value)} />
                  <Legend />
                  <Line
                    type="monotone"
                    name="Doanh Thu"
                    dataKey="doanhThu"
                    stroke="#22C55E"
                    strokeWidth={3}
                    activeDot={{ r: 8 }}
                  />
                  <Line
                    type="monotone"
                    name="Chi Phí Nhập Kho"
                    dataKey="chiPhi"
                    stroke="#EF4444"
                    strokeWidth={3}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 italic text-center mt-20">
                Chưa có phát sinh giao dịch
              </p>
            )}
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-blue-100 shadow-sm lg:col-span-2">
          <h3 className="font-bold text-gray-800 mb-6">
            🍩 Tỷ trọng Tổng Thu vs Tổng Chi (30 ngày)
          </h3>
          <div className="h-[300px] w-full">
            {tongDoanhThu > 0 || tongChiPhi > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dataCoCauThuChi}
                    cx="50%"
                    cy="50%"
                    outerRadius={110}
                    label={(e) => `${e.name}: ${formatVN(e.value)}`}
                    dataKey="value"
                  >
                    <Cell fill="#22C55E" /> {/* Xanh cho Doanh Thu */}
                    <Cell fill="#EF4444" /> {/* Đỏ cho Chi Phí */}
                  </Pie>
                  <Tooltip formatter={(value) => formatVN(value)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 italic text-center mt-20">
                Chưa đủ dữ liệu
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderNhanSu = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
      <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-sm">
        <h3 className="font-bold text-gray-800 mb-6">
          🧑‍💼 Phân bổ nhân sự theo chức vụ
        </h3>
        <div className="h-[300px] w-full">
          {reportData.nhanSu.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData.nhanSu}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar
                  dataKey="value"
                  name="Số lượng người"
                  fill="#8B5CF6"
                  radius={[6, 6, 0, 0]}
                  barSize={40}
                >
                  {reportData.nhanSu.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 italic text-center mt-20">
              Chưa có nhân viên nào
            </p>
          )}
        </div>
      </div>
    </div>
  );

  const renderSanXuat = () => (
    <div className="grid grid-cols-1 gap-6 animate-fade-in">
      <div className="bg-white p-6 rounded-3xl border border-orange-100 shadow-sm">
        <h3 className="font-bold text-red-600 mb-6">
          🚨 Cảnh báo 10 Nguyên liệu sắp cạn kiệt
        </h3>
        <div className="h-[350px] w-full">
          {reportData.tonKho.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={reportData.tonKho}
                layout="vertical"
                margin={{ top: 20, right: 20, bottom: 20, left: 40 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={true}
                  vertical={false}
                />
                <XAxis type="number" />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={120}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="tonKho"
                  name="Tồn kho hiện tại"
                  fill="#F59E0B"
                  barSize={20}
                  radius={[0, 4, 4, 0]}
                />
                <Line
                  dataKey="dinhMuc"
                  name="Mức an toàn"
                  type="monotone"
                  stroke="#EF4444"
                  strokeWidth={3}
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <span className="text-5xl mb-4">✅</span>
              <p className="text-green-600 font-bold text-lg">
                Kho hàng đang dồi dào!
              </p>
              <p className="text-gray-400 text-sm">
                Không có nguyên liệu nào dưới định mức an toàn.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 font-sans text-gray-800 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-green-100">
        <div>
          <h1 className="text-2xl font-black text-gray-800">
            Trung tâm Thống kê & Phân tích
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Chức vụ của bạn:{" "}
            <span className="font-bold text-green-600 uppercase">{role}</span>
          </p>
        </div>
        <button
          onClick={fetchReportData}
          disabled={loadingReports}
          className="px-6 py-2.5 bg-green-500 text-white font-bold rounded-xl shadow-sm hover:bg-green-600 disabled:opacity-50 transition"
        >
          {loadingReports ? "Đang xử lý..." : "🔄 Làm mới dữ liệu"}
        </button>
      </div>

      {/* TABS CHUYỂN ĐỔI */}
      {allowedTabs.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {allowedTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap px-6 py-3 rounded-2xl text-sm font-black shadow-sm transition-all ${
                activeTab === tab.id
                  ? "bg-green-500 text-white transform -translate-y-1 shadow-green-500/30"
                  : "bg-white text-gray-500 border border-gray-100 hover:bg-green-50 hover:text-green-600"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* RENDER KHU VỰC BIỂU ĐỒ */}
      <div className="mt-4 relative min-h-[400px]">
        {loadingReports ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-10 rounded-3xl">
            <div className="font-bold text-green-600 text-lg animate-pulse">
              Đang nạp dữ liệu từ máy chủ...
            </div>
          </div>
        ) : null}

        {activeTab === "van-hanh" && renderVanHanh()}
        {activeTab === "ke-toan" && renderKeToan()}
        {activeTab === "nhan-su" && renderNhanSu()}
        {activeTab === "san-xuat" && renderSanXuat()}
      </div>
    </div>
  );
};

export default DashboardPage;
