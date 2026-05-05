import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import CreateEmployeeForm from "../../components/CreateEmployeeForm.jsx"; // Đảm bảo đường dẫn này đúng với máy bạn

// --- SETUP API ---
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

const getAvatarUrl = (avatar) => {
  if (!avatar) return null;
  if (avatar.startsWith("http") || avatar.startsWith("data:")) return avatar;
  if (avatar.startsWith("/")) return `http://localhost:5017${avatar}`;
  return avatar;
};

const EmployeePage = () => {
  // --- STATE CHUNG ---
  const [activeTab, setActiveTab] = useState("employees"); // 'employees' | 'roles'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [employees, setEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
  const [shops, setShops] = useState([]); // Cần danh sách cửa hàng để form update NV chọn được cửa hàng

  // --- STATE CHO NHÂN VIÊN ---
  const [searchEmployee, setSearchEmployee] = useState("");
  const [employeeSearchType, setEmployeeSearchType] = useState("name");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showCreateEmpForm, setShowCreateEmpForm] = useState(false);
  const [employeeForm, setEmployeeForm] = useState({
    name: "",
    sdt: "",
    email: "",
    ngaySinh: "",
    gioiTinh: "",
    chucVuId: "",
    cuaHangId: "",
    tenDangNhap: "",
  });

  // --- STATE CHO CHỨC VỤ ---
  const [newRole, setNewRole] = useState({ name: "", description: "" });
  const [editingRole, setEditingRole] = useState(null);
  const [searchRoleKey, setSearchRoleKey] = useState("");

  const authHeaders = useMemo(() => {
    const token = getAdminToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const handleApiError = (e) => {
    console.error(e);
    const msg =
      e?.response?.data?.message ||
      e?.response?.data ||
      e.message ||
      "Có lỗi xảy ra, vui lòng thử lại";
    setError(typeof msg === "string" ? msg : "Có lỗi xảy ra, vui lòng thử lại");
    alert(typeof msg === "string" ? msg : "Có lỗi xảy ra, vui lòng thử lại");
  };

  // --- TẢI DỮ LIỆU BAN ĐẦU ---
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [emp, r, s] = await Promise.allSettled([
          api.get("/admin/Employee", { headers: authHeaders }),
          api.get("/admin/Role", { headers: authHeaders }),
          api.get("/admin/ShopInfo", { headers: authHeaders }),
        ]);

        if (emp.status === "fulfilled") {
          const data = emp.value.data;
          setEmployees(
            Array.isArray(data) ? data : data?.data || data?.employees || [],
          );
        }
        if (r.status === "fulfilled") {
          const data = r.value.data;
          setRoles(
            Array.isArray(data) ? data : data?.data || data?.roles || [],
          );
        }
        if (s.status === "fulfilled") {
          const data = s.value.data;
          setShops(
            Array.isArray(data) ? data : data?.data || data?.shops || [],
          );
        }
      } catch (e) {
        handleApiError(e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [authHeaders]);

  // ==========================================
  // LOGIC NHÂN VIÊN
  // ==========================================
  const handleResetEmployees = async () => {
    try {
      setLoading(true);
      setSearchEmployee("");
      const res = await api.get("/admin/Employee", { headers: authHeaders });
      if (Array.isArray(res.data)) setEmployees(res.data);
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeCreated = async () => {
    await handleResetEmployees();
    setShowCreateEmpForm(false);
  };

  const openEmployeeDetail = (emp) => {
    setSelectedEmployee(emp);
    setEmployeeForm({
      name: emp.tenNhanVien || "",
      sdt: emp.sdt || "",
      email: emp.email || "",
      ngaySinh: emp.ngaySinh ? emp.ngaySinh.slice(0, 10) : "",
      gioiTinh:
        typeof emp.gioiTinh === "boolean" ? String(emp.gioiTinh) : "" || "",
      chucVuId:
        emp.chucVuId || emp.chucVu?.chucVuId
          ? String(emp.chucVuId || emp.chucVu?.chucVuId)
          : "",
      cuaHangId:
        emp.cuaHangId || emp.cuaHang?.cuaHangId
          ? String(emp.cuaHangId || emp.cuaHang?.cuaHangId)
          : "",
      tenDangNhap: emp.tenTaiKhoan || "",
    });
  };

  const handleUpdateEmployee = async (e) => {
    e.preventDefault();
    if (!selectedEmployee) return;
    try {
      setLoading(true);
      const form = new FormData();
      if (employeeForm.name) form.append("name", employeeForm.name);
      if (employeeForm.sdt) form.append("sdt", employeeForm.sdt);
      if (employeeForm.email) form.append("email", employeeForm.email);
      if (employeeForm.ngaySinh) form.append("NgaySinh", employeeForm.ngaySinh);
      if (employeeForm.gioiTinh !== "")
        form.append("GioiTinh", employeeForm.gioiTinh);
      if (employeeForm.tenDangNhap)
        form.append("newTenDangNhap", employeeForm.tenDangNhap);
      if (employeeForm.chucVuId)
        form.append("newChucVuId", employeeForm.chucVuId);
      if (employeeForm.cuaHangId)
        form.append("newCuaHangId", employeeForm.cuaHangId);

      const id =
        selectedEmployee.taiKhoanNoiBoId || selectedEmployee.id || null;
      await api.put(`/admin/Employee/admin-update/${id}`, form, {
        headers: authHeaders,
      });

      const updated = await api.get("/admin/Employee", {
        headers: authHeaders,
      });
      if (Array.isArray(updated.data)) setEmployees(updated.data);
      alert("Cập nhật nhân viên thành công!");
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchEmployee = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const key = searchEmployee.trim();
      let url = "/admin/Employee";
      let params = {};
      if (key) {
        switch (employeeSearchType) {
          case "name":
            url = "/admin/Employee/search-by-name";
            params = { key };
            break;
          case "store":
            url = "/admin/Employee/search-by-store";
            params = { key };
            break;
          case "id":
            url = "/admin/Employee/search-by-id";
            params = { id: key };
            break;
          case "role":
            url = "/admin/Employee/search-by-role";
            params = { key };
            break;
          default:
            url = "/admin/Employee";
            break;
        }
      }
      const res = await api.get(url, { headers: authHeaders, params });
      if (Array.isArray(res.data)) setEmployees(res.data);
      else if (res.data) setEmployees([res.data]);
      else setEmployees([]);
    } catch (err) {
      if (err?.response?.status === 404) setEmployees([]);
      else handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEmployee = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa nhân viên này?")) return;
    try {
      setLoading(true);
      await api.delete(`/admin/Employee/${id}`, { headers: authHeaders });
      const updated = await api.get("/admin/Employee", {
        headers: authHeaders,
      });
      if (Array.isArray(updated.data)) setEmployees(updated.data);
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // LOGIC CHỨC VỤ
  // ==========================================
  const handleSearchRole = async (key) => {
    try {
      setLoading(true);
      const url = key
        ? `/admin/Role/search-by-name?key=${encodeURIComponent(key)}`
        : "/admin/Role";
      const res = await api.get(url, { headers: authHeaders });
      const data = res.data;
      if (Array.isArray(data)) setRoles(data);
      else if (data && typeof data === "object")
        setRoles(data.data || data.roles || []);
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const form = new FormData();
      form.append("name", newRole.name);
      form.append("description", newRole.description);
      await api.post("/admin/Role", form, { headers: authHeaders });
      await handleSearchRole(searchRoleKey);
      setNewRole({ name: "", description: "" });
      alert("Tạo chức vụ thành công!");
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditRole = (role) => {
    setEditingRole({
      id: role.chucVuId || role.id,
      name: role.chucVuName || "",
      description: role.chucVuDescription || "",
    });
  };

  const handleUpdateRole = async (e) => {
    e.preventDefault();
    if (!editingRole) return;
    try {
      setLoading(true);
      const body = {
        name: editingRole.name,
        description: editingRole.description,
      };
      await api.put(`/admin/Role/role-update/${editingRole.id}`, body, {
        headers: { ...authHeaders, "Content-Type": "application/json" },
      });
      await handleSearchRole(searchRoleKey);
      setEditingRole(null);
      alert("Cập nhật chức vụ thành công!");
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRole = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa chức vụ này?")) return;
    try {
      setLoading(true);
      await api.delete(`/admin/Role?id=${id}`, { headers: authHeaders });
      await handleSearchRole(searchRoleKey);
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // RENDER UI
  // ==========================================
  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in font-sans text-gray-800">
      {/* HEADER & TAB CHUYỂN ĐỔI */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-green-100">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-800 flex items-center gap-2">
            👩‍🍳 Quản lý Nhân sự
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý danh sách nhân viên và thiết lập chức vụ trong hệ thống.
          </p>
        </div>

        {/* NÚT CHUYỂN TAB */}
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("employees")}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === "employees"
                ? "bg-white text-green-600 shadow-sm"
                : "text-gray-500 hover:text-green-500"
            }`}
          >
            Nhân viên
          </button>
          <button
            onClick={() => setActiveTab("roles")}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === "roles"
                ? "bg-white text-green-600 shadow-sm"
                : "text-gray-500 hover:text-green-500"
            }`}
          >
            Chức vụ
          </button>
        </div>
      </div>

      {loading && (
        <div className="text-center text-green-500 font-bold animate-pulse">
          Đang xử lý dữ liệu...
        </div>
      )}

      {/* ==================================== */}
      {/* GIAO DIỆN TAB 1: NHÂN VIÊN           */}
      {/* ==================================== */}
      {activeTab === "employees" && (
        <div className="space-y-4">
          {/* Thanh công cụ tìm kiếm & Thêm NV */}
          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center bg-white p-4 rounded-2xl shadow-sm border border-green-100">
            <form
              onSubmit={handleSearchEmployee}
              className="flex flex-col sm:flex-row gap-2 w-full"
            >
              <select
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                value={employeeSearchType}
                onChange={(e) => setEmployeeSearchType(e.target.value)}
              >
                <option value="name">Theo tên</option>
                <option value="store">Theo cửa hàng</option>
                <option value="role">Theo chức vụ</option>
                <option value="id">Theo mã nhân viên</option>
              </select>
              <input
                type="text"
                placeholder="Nhập từ khóa..."
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                value={searchEmployee}
                onChange={(e) => setSearchEmployee(e.target.value)}
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-green-500 text-sm font-bold text-white shadow-sm hover:bg-green-600 transition"
              >
                Tìm
              </button>
              <button
                type="button"
                onClick={handleResetEmployees}
                className="px-4 py-2 rounded-xl bg-gray-100 text-sm font-bold text-gray-600 shadow-sm hover:bg-gray-200 transition"
              >
                Tải lại
              </button>
              <button
                type="button"
                onClick={() => setShowCreateEmpForm(!showCreateEmpForm)}
                className="px-4 py-2 rounded-xl bg-yellow-400 text-sm font-bold text-yellow-900 shadow-sm hover:bg-yellow-500 transition ml-auto"
              >
                {showCreateEmpForm ? "Đóng Form" : "+ Thêm NV"}
              </button>
            </form>
          </div>

          {/* Form Thêm NV */}
          {showCreateEmpForm && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-green-200 animate-fade-in">
              <CreateEmployeeForm
                roles={roles}
                shops={shops}
                onSuccess={handleEmployeeCreated}
              />
            </div>
          )}

          {/* Bảng Danh sách NV */}
          <div className="rounded-2xl bg-white border border-green-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto text-sm">
              <table className="min-w-full text-left">
                <thead className="text-xs uppercase font-bold text-green-700 bg-green-50 border-b border-green-100">
                  <tr>
                    <th className="py-3 px-4">Ảnh</th>
                    <th className="py-3 px-4">Tên / Tài khoản</th>
                    <th className="py-3 px-4">Chức vụ</th>
                    <th className="py-3 px-4">Cửa hàng</th>
                    <th className="py-3 px-4">Liên hệ</th>
                    <th className="py-3 px-4 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {employees.map((e, index) => (
                    <tr
                      key={e.taiKhoanNoiBoId || e.id || `emp-${index}`}
                      className="hover:bg-green-50/50 cursor-pointer transition"
                      onClick={() => openEmployeeDetail(e)}
                      title="Bấm để chỉnh sửa"
                    >
                      <td className="py-3 px-4">
                        {e.avatar || e.avatarUrl ? (
                          <img
                            src={getAvatarUrl(e.avatar || e.avatarUrl)}
                            alt="avatar"
                            className="h-10 w-10 rounded-full object-cover border border-green-200"
                            onError={(ev) => (ev.target.style.display = "none")}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-sm font-bold text-green-600">
                            {e.tenNhanVien?.charAt(0)?.toUpperCase() || "NV"}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-gray-800">
                          {e.tenNhanVien}
                        </p>
                        <p className="text-xs text-gray-500">{e.tenTaiKhoan}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded-lg text-xs font-semibold">
                          {e.chucVu?.chucVuName}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {e.cuaHang?.shopName || "N/A"}
                      </td>
                      <td className="py-3 px-4 text-gray-600 text-xs">
                        <p>{e.sdt}</p>
                        <p>{e.email}</p>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(ev) => {
                            ev.stopPropagation();
                            handleDeleteEmployee(e.taiKhoanNoiBoId || e.id);
                          }}
                          className="text-red-500 hover:underline font-semibold"
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                  {employees.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-6 text-center text-gray-500"
                      >
                        Không có nhân viên phù hợp.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Form Cập Nhật NV */}
          <div className="w-full">
            <section className="rounded-2xl bg-white border border-yellow-200 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-yellow-500">✏️</span> Cập nhật thông tin
                nhân viên
              </h3>
              {selectedEmployee ? (
                <form
                  className="space-y-4 text-sm"
                  onSubmit={handleUpdateEmployee}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-gray-600">
                        Họ tên
                      </label>
                      <input
                        type="text"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-green-500"
                        value={employeeForm.name}
                        onChange={(e) =>
                          setEmployeeForm({
                            ...employeeForm,
                            name: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-gray-600">
                        Tên đăng nhập
                      </label>
                      <input
                        type="text"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-green-500"
                        value={employeeForm.tenDangNhap}
                        onChange={(e) =>
                          setEmployeeForm({
                            ...employeeForm,
                            tenDangNhap: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-gray-600">
                        Số điện thoại
                      </label>
                      <input
                        type="tel"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-green-500"
                        value={employeeForm.sdt}
                        onChange={(e) =>
                          setEmployeeForm({
                            ...employeeForm,
                            sdt: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-gray-600">
                        Email
                      </label>
                      <input
                        type="email"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-green-500"
                        value={employeeForm.email}
                        onChange={(e) =>
                          setEmployeeForm({
                            ...employeeForm,
                            email: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-gray-600">
                        Ngày sinh
                      </label>
                      <input
                        type="date"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-green-500"
                        value={employeeForm.ngaySinh}
                        onChange={(e) =>
                          setEmployeeForm({
                            ...employeeForm,
                            ngaySinh: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-gray-600">
                        Giới tính
                      </label>
                      <select
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-green-500"
                        value={employeeForm.gioiTinh}
                        onChange={(e) =>
                          setEmployeeForm({
                            ...employeeForm,
                            gioiTinh: e.target.value,
                          })
                        }
                      >
                        <option value="">Không đổi</option>
                        <option value="true">Nam</option>
                        <option value="false">Nữ</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-gray-600">
                        Chức vụ
                      </label>
                      <select
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-green-500"
                        value={employeeForm.chucVuId}
                        onChange={(e) =>
                          setEmployeeForm({
                            ...employeeForm,
                            chucVuId: e.target.value,
                          })
                        }
                      >
                        <option value="">Không đổi</option>
                        {roles.map((r) => (
                          <option
                            key={r.chucVuId || r.id}
                            value={String(r.chucVuId || r.id)}
                          >
                            {r.chucVuName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-gray-600">
                        Cửa hàng
                      </label>
                      <select
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-green-500"
                        value={employeeForm.cuaHangId}
                        onChange={(e) =>
                          setEmployeeForm({
                            ...employeeForm,
                            cuaHangId: e.target.value,
                          })
                        }
                      >
                        <option value="">Không đổi</option>
                        {shops.map((s) => (
                          <option
                            key={s.shopId || s.cuaHangId || s.id}
                            value={String(s.shopId || s.cuaHangId || s.id)}
                          >
                            {s.shopName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 pt-4 border-t border-gray-100">
                    <span className="text-xs text-gray-400">
                      Đang chỉnh sửa nhân viên mã:{" "}
                      {selectedEmployee.taiKhoanNoiBoId || selectedEmployee.id}
                    </span>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-2.5 rounded-xl bg-yellow-400 text-sm font-bold text-yellow-900 hover:bg-yellow-500 shadow-sm transition"
                    >
                      Lưu thay đổi
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <span className="text-3xl mb-2 text-gray-300">👆</span>
                  <p className="text-sm text-gray-500">
                    Chọn một nhân viên trong bảng bên trên để chỉnh sửa.
                  </p>
                </div>
              )}
            </section>
          </div>
        </div>
      )}

      {/* ==================================== */}
      {/* GIAO DIỆN TAB 2: CHỨC VỤ             */}
      {/* ==================================== */}
      {activeTab === "roles" && (
        <div className="grid gap-6 lg:grid-cols-[1.2fr,1fr]">
          <section className="space-y-4">
            <div className="mb-4">
              <input
                type="text"
                placeholder="Tìm theo tên chức vụ..."
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                value={searchRoleKey}
                onChange={(e) => {
                  setSearchRoleKey(e.target.value);
                  handleSearchRole(e.target.value);
                }}
              />
            </div>
            <div className="rounded-2xl bg-white border border-green-100 overflow-hidden shadow-sm">
              <div className="overflow-x-auto text-sm">
                <table className="min-w-full text-left">
                  <thead className="text-xs uppercase font-bold text-green-700 bg-green-50 border-b border-green-100">
                    <tr>
                      <th className="py-3 px-4">Tên chức vụ</th>
                      <th className="py-3 px-4">Mô tả</th>
                      <th className="py-3 px-4 text-right">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {roles.map((r, index) => (
                      <tr
                        key={r.chucVuId || r.id || `role-${index}`}
                        className="hover:bg-gray-50 transition"
                      >
                        <td className="py-4 px-4 text-gray-800 font-bold">
                          {r.chucVuName}
                        </td>
                        <td className="py-4 px-4 text-gray-600">
                          {r.chucVuDescription}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <button
                            className="text-blue-500 hover:underline mr-3 font-semibold"
                            onClick={() => handleEditRole(r)}
                          >
                            Sửa
                          </button>
                          <button
                            className="text-red-500 hover:underline font-semibold"
                            onClick={() => handleDeleteRole(r.chucVuId || r.id)}
                          >
                            Xóa
                          </button>
                        </td>
                      </tr>
                    ))}
                    {roles.length === 0 && (
                      <tr>
                        <td
                          colSpan={3}
                          className="py-6 text-center text-gray-500"
                        >
                          Chưa có chức vụ nào.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Form Thêm/Sửa Chức vụ */}
          <section className="rounded-2xl bg-white border border-green-100 p-6 shadow-sm h-fit">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              {editingRole ? "✏️ Chỉnh sửa chức vụ" : "✨ Thêm chức vụ mới"}
            </h3>
            <form
              className="space-y-4 text-sm"
              onSubmit={editingRole ? handleUpdateRole : handleCreateRole}
            >
              <div className="space-y-2">
                <label className="block font-bold text-gray-700">
                  Tên chức vụ
                </label>
                <input
                  type="text"
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-green-500"
                  value={editingRole ? editingRole.name : newRole.name}
                  onChange={(e) =>
                    editingRole
                      ? setEditingRole({ ...editingRole, name: e.target.value })
                      : setNewRole({ ...newRole, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="block font-bold text-gray-700">Mô tả</label>
                <textarea
                  rows={3}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-green-500"
                  value={
                    editingRole ? editingRole.description : newRole.description
                  }
                  onChange={(e) =>
                    editingRole
                      ? setEditingRole({
                          ...editingRole,
                          description: e.target.value,
                        })
                      : setNewRole({ ...newRole, description: e.target.value })
                  }
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-3 rounded-xl bg-green-500 font-bold text-white hover:bg-green-600 shadow-sm transition"
                >
                  {editingRole ? "Cập nhật" : "Lưu chức vụ"}
                </button>
                {editingRole && (
                  <button
                    type="button"
                    onClick={() => setEditingRole(null)}
                    className="flex-1 px-4 py-3 rounded-xl bg-gray-200 font-bold text-gray-700 hover:bg-gray-300"
                  >
                    Hủy
                  </button>
                )}
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
};

export default EmployeePage;
