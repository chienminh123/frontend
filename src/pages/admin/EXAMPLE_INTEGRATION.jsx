/**
 * VÍ DỤ TÍCH HỢP CreateEmployeeForm VÀO DashboardPage.jsx
 *
 * Đây là ví dụ đơn giản về cách thêm form tạo nhân viên mới
 * vào trang DashboardPage hiện tại
 */

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import CreateEmployeeForm from "../components/CreateEmployeeForm";

const api = axios.create({
  baseURL: "/api",
  headers: {
    Accept: "application/json",
  },
});

// ... (rest của API setup code)

const DashboardPage = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [employees, setEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
  const [shops, setShops] = useState([]);
  const [products, setProducts] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [partners, setPartners] = useState([]);
  const [inventory, setInventory] = useState([]);

  // ... (rest của state declarations)

  const authHeaders = useMemo(() => {
    const token =
      window.localStorage.getItem("adminToken") ||
      window.localStorage.getItem("token") ||
      "";
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  // ============================================================================
  // HÀM REFRESH DANH SÁCH NHÂN VIÊN - Gọi sau khi tạo nhân viên mới
  // ============================================================================
  const refreshEmployeeList = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/Employee", { headers: authHeaders });
      if (Array.isArray(res.data)) {
        setEmployees(res.data);
      }
    } catch (err) {
      console.error("Error refreshing employees:", err);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // CALLBACK - Được gọi khi form tạo nhân viên thành công
  // ============================================================================
  const handleEmployeeCreated = async (newEmployeeData) => {
    console.log("✅ Nhân viên mới được tạo:", newEmployeeData);

    // Reload danh sách nhân viên từ server
    await refreshEmployeeList();

    // Optional: Chuyển tab sang danh sách nhân viên
    setActiveTab("employees");

    // Optional: Hiển thị thông báo thành công
    // Có thể thêm toast notification nếu có thư viện toast
  };

  // Load dữ liệu ban đầu
  useEffect(() => {
    const loadAll = async () => {
      try {
        setLoading(true);
        setError("");

        const [emp, r, s, p, d, pt] = await Promise.allSettled([
          api.get("/admin/Employee", { headers: authHeaders }),
          api.get("/admin/Role", { headers: authHeaders }),
          api.get("/admin/ShopInfo", { headers: authHeaders }),
          api.get("/admin/Product", { headers: authHeaders }),
          api.get("/admin/Discount", { headers: authHeaders }),
          api.get("/DoiTac", { headers: authHeaders }),
        ]);

        // Xử lý employees
        if (emp.status === "fulfilled") {
          const empData = emp.value.data;
          setEmployees(Array.isArray(empData) ? empData : empData?.data || []);
        }

        // Xử lý roles
        if (r.status === "fulfilled") {
          const rData = r.value.data;
          setRoles(Array.isArray(rData) ? rData : rData?.data || []);
        }

        // Xử lý shops
        if (s.status === "fulfilled") {
          const sData = s.value.data;
          setShops(Array.isArray(sData) ? sData : sData?.data || []);
        }

        // ... (xử lý products, discounts, partners)
      } catch (e) {
        console.error("LoadAll Error:", e);
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, [authHeaders]);

  // ============================================================================
  // RENDER NỘI DUNG THEO TAB
  // ============================================================================
  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return <div>{/* renderOverview() */}</div>;

      case "employees":
        return (
          <div className="space-y-6">
            {/* PHẦN FORM TẠO NHÂN VIÊN MỚI */}
            <div>
              <h2 className="text-xl font-semibold text-slate-100 mb-4">
                Thêm nhân viên mới
              </h2>
              <CreateEmployeeForm
                roles={roles}
                shops={shops}
                onSuccess={handleEmployeeCreated}
              />
            </div>

            {/* PHẦN DANH SÁCH NHÂN VIÊN HIỆN TẠI */}
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-slate-100 mb-4">
                Danh sách nhân viên ({employees.length})
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-left">
                  <thead className="bg-slate-800 text-slate-100 uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Tên</th>
                      <th className="px-4 py-3">Chức vụ</th>
                      <th className="px-4 py-3">Cửa hàng</th>
                      <th className="px-4 py-3">Số ĐT</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {employees.map((emp, idx) => (
                      <tr
                        key={emp.taiKhoanNoiBoId || idx}
                        className="hover:bg-slate-800/50"
                      >
                        <td className="px-4 py-3 text-slate-100 font-medium">
                          {emp.tenNhanVien}
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          {emp.chucVu?.chucVuName || "-"}
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          {emp.cuaHang?.shopName || "-"}
                        </td>
                        <td className="px-4 py-3 text-slate-300">{emp.sdt}</td>
                        <td className="px-4 py-3 text-slate-300">
                          {emp.email}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              emp.isActive
                                ? "bg-green-500/10 text-green-400"
                                : "bg-red-500/10 text-red-400"
                            }`}
                          >
                            {emp.isActive ? "Hoạt động" : "Bị khóa"}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {employees.length === 0 && (
                      <tr>
                        <td
                          colSpan="6"
                          className="px-4 py-6 text-center text-slate-400"
                        >
                          Chưa có dữ liệu nhân viên
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case "products":
        return <div>{/* renderProducts() */}</div>;

      case "shops":
        return <div>{/* renderShops() */}</div>;

      // ... (các tab khác)

      default:
        return null;
    }
  };

  // ============================================================================
  // RENDER TAB NAVIGATION
  // ============================================================================
  const renderTabs = () => (
    <div className="flex gap-2 mb-6 border-b border-slate-700">
      <button
        onClick={() => setActiveTab("overview")}
        className={`px-4 py-2 font-medium border-b-2 transition-colors ${
          activeTab === "overview"
            ? "border-blue-500 text-blue-400"
            : "border-transparent text-slate-400 hover:text-slate-200"
        }`}
      >
        Tổng quan
      </button>
      <button
        onClick={() => setActiveTab("employees")}
        className={`px-4 py-2 font-medium border-b-2 transition-colors ${
          activeTab === "employees"
            ? "border-blue-500 text-blue-400"
            : "border-transparent text-slate-400 hover:text-slate-200"
        }`}
      >
        Nhân viên
      </button>
      <button
        onClick={() => setActiveTab("products")}
        className={`px-4 py-2 font-medium border-b-2 transition-colors ${
          activeTab === "products"
            ? "border-blue-500 text-blue-400"
            : "border-transparent text-slate-400 hover:text-slate-200"
        }`}
      >
        Sản phẩm
      </button>
      <button
        onClick={() => setActiveTab("shops")}
        className={`px-4 py-2 font-medium border-b-2 transition-colors ${
          activeTab === "shops"
            ? "border-blue-500 text-blue-400"
            : "border-transparent text-slate-400 hover:text-slate-200"
        }`}
      >
        Cửa hàng
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <h1 className="text-3xl font-bold text-slate-100 mb-2">
          Bảng điều khiển quản trị
        </h1>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500 rounded text-red-400">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500 rounded text-blue-400">
            Đang tải dữ liệu...
          </div>
        )}

        {/* Tabs */}
        {renderTabs()}

        {/* Content */}
        {renderContent()}
      </div>
    </div>
  );
};

export default DashboardPage;

/**
 * ============================================================================
 * HƯỚNG DẪN SỬ DỤNG
 * ============================================================================
 *
 * 1. Import component CreateEmployeeForm ở đầu file:
 *    import CreateEmployeeForm from "../components/CreateEmployeeForm";
 *
 * 2. Thêm state để quản lý tab (nếu chưa có):
 *    const [activeTab, setActiveTab] = useState("overview");
 *
 * 3. Thêm function handleEmployeeCreated:
 *    - Gọi refreshEmployeeList() để load lại danh sách
 *    - Optional: Chuyển tab sang "employees"
 *
 * 4. Trong JSX của tab "employees", add CreateEmployeeForm:
 *    <CreateEmployeeForm
 *      roles={roles}
 *      shops={shops}
 *      onSuccess={handleEmployeeCreated}
 *    />
 *
 * ============================================================================
 * PROPS CỦA CreateEmployeeForm
 * ============================================================================
 *
 * - roles: Array<{chucVuId, chucVuName}> - Danh sách chức vụ
 * - shops: Array<{cuaHangId, shopName}> - Danh sách cửa hàng
 * - onSuccess: Function(newEmployee) - Callback khi tạo thành công
 *
 * ============================================================================
 */
