import React, { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import axios from "axios";
import CreateEmployeeForm from "../../components/CreateEmployeeForm.jsx";
import PayrollTab from "./PayrollTab";

const api = axios.create({
  baseURL: "/api",
  headers: { Accept: "application/json" },
});

const getAdminToken = () =>
  window.localStorage.getItem("adminToken") ||
  window.localStorage.getItem("token") ||
  "";

// Helper: Xử lý avatar URL để đảm bảo nó là URL đầy đủ
const getAvatarUrl = (avatar) => {
  if (!avatar) return null;
  // Nếu là URL tuyệt đối hoặc data URL
  if (avatar.startsWith("http") || avatar.startsWith("data:")) {
    return avatar;
  }
  // Nếu là path tương đối, thêm baseURL từ server
  if (avatar.startsWith("/")) {
    return `http://localhost:5017${avatar}`;
  }
  return avatar;
};

const getCoordinatesFromAddress = async (address, city) => {
  try {
    const query = `${address}, ${city}, Việt Nam`;
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`,
    );
    const data = await res.json();
    if (data && data.length > 0) {
      return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
    }
    return null;
  } catch (error) {
    console.error("Lỗi lấy tọa độ:", error);
    return null;
  }
};
api.interceptors.request.use((config) => {
  const token = getAdminToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const DashboardPage = () => {
  const outletContext = useOutletContext();
  const user = outletContext?.user || {};
  const role = user?.role || "Admin"; // default to Admin if not found

  const roleGroups = [
    {
      id: "overview",
      label: "📊 Tổng quan",
      roles: [
        "Admin",
        "HR",
        "StoreManager",
        "AreaManager",
        "Accountant",
        "Production",
        "Attendance",
      ],
      subTabs: [{ id: "overview", label: "Tổng quan" }],
    },
    {
      id: "hr",
      label: "👩‍🍳 Nhân sự",
      roles: ["Admin", "HR"],
      subTabs: [
        { id: "employees", label: "Quản lý nhân viên" },
        { id: "roles", label: "Quản lý chức vụ" },
      ],
    },
    {
      id: "operations",
      label: "🏪 Vận hành",
      roles: ["Admin", "StoreManager", "AreaManager"],
      subTabs: [
        { id: "shops", label: "Quản lý cửa hàng" },
        { id: "products", label: "Quản lý sản phẩm" },
        { id: "discounts", label: "Quản lý khuyến mãi" },
        { id: "reports", label: "Báo cáo doanh thu" },
        { id: "invoices", label: "Hóa đơn" },
      ],
    },
    {
      id: "accounting",
      label: "💰 Kế toán",
      roles: ["Admin", "Accountant"],
      subTabs: [
        { id: "invoices", label: "Hóa đơn" },
        { id: "payroll", label: "Bảng lương" },
      ],
    },
    {
      id: "production",
      label: "🏭 Sản xuất",
      roles: ["Admin", "Production"],
      subTabs: [
        { id: "partners", label: "Quản lý đối tác" },
        { id: "kho", label: "Quản lý kho" },
      ],
    },
    {
      id: "attendance",
      label: "⏰ Chấm công",
      roles: [
        "Admin",
        "HR",
        "StoreManager",
        "AreaManager",
        "Accountant",
        "Production",
        "Attendance",
      ],
      subTabs: [
        { id: "attendance", label: "Dữ liệu chấm công" },
        { id: "payroll", label: "Bảng lương" },
      ],
    },
  ];

  const availableGroups = roleGroups.filter((group) =>
    group.roles.includes(role),
  );

  const getInitialGroupId = () => {
    if (availableGroups.length === 0) return "overview";
    return availableGroups[0].id;
  };

  const [activeGroup, setActiveGroup] = useState(getInitialGroupId());
  const [activeTab, setActiveTab] = useState(
    availableGroups.find((g) => g.id === getInitialGroupId())?.subTabs[0]?.id ||
      "overview",
  );

  // Sync active group/tab when role changes
  useEffect(() => {
    const newGroupId = getInitialGroupId();
    setActiveGroup(newGroupId);
    setActiveTab(
      availableGroups.find((g) => g.id === newGroupId)?.subTabs[0]?.id ||
        "overview",
    );
  }, [role]);

  const setGroupAndTab = (groupId) => {
    const group = availableGroups.find((g) => g.id === groupId);
    if (!group) return;
    setActiveGroup(groupId);
    setActiveTab(group.subTabs[0]?.id || "overview");
  };

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [employees, setEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
  const [shops, setShops] = useState([]);
  const [products, setProducts] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [partners, setPartners] = useState([]);
  const [inventory, setInventory] = useState([]);

  const [searchEmployee, setSearchEmployee] = useState("");
  const [employeeSearchType, setEmployeeSearchType] = useState("name");
  const [searchProduct, setSearchProduct] = useState("");
  const [searchShop, setSearchShop] = useState("");
  const [searchPartner, setSearchPartner] = useState("");

  const [selectedEmployee, setSelectedEmployee] = useState(null);
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

  const [newRole, setNewRole] = useState({ name: "", description: "" });
  // role management helpers
  const [editingRole, setEditingRole] = useState(null); // { id, name, description }
  const [searchRoleKey, setSearchRoleKey] = useState("");

  const [newShop, setNewShop] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    latitude: null,
    longitude: null,
    allowedRadius: 50,
  });
  // shop management helpers
  const [editingShop, setEditingShop] = useState(null); // { id, name, phone, address, city }
  const [searchShopKey, setSearchShopKey] = useState("");
  const [newPartner, setNewPartner] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });
  // partner management helpers
  const [editingPartner, setEditingPartner] = useState(null);
  const [searchPartnerKey, setSearchPartnerKey] = useState("");
  const [newDiscount, setNewDiscount] = useState({
    Code: "",
    LoaiMa: "Persent",
    MaxValue: "",
    SoLuong: "",
    NgayBatDau: "",
    NgayKetThuc: "",
  });
  // discount management helpers
  const [editingDiscount, setEditingDiscount] = useState(null);
  const [searchDiscountKey, setSearchDiscountKey] = useState("");

  const [newProduct, setNewProduct] = useState({
    SanPhamName: "",
    TheLoaiId: "",
    NguyenLieuId: "",
    Size: "",
    MoTa: "",
    GiaBan: "",
    IsActive: true,
    HinhAnhUpload: null,
  });
  // product management helpers
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchProductKey, setSearchProductKey] = useState("");
  const [categories, setCategories] = useState([]); // theLoai list
  const [ingredients, setIngredients] = useState([]); // nguyenLieu list
  const [khoShopId, setKhoShopId] = useState("");

  const [showCreateEmpForm, setShowCreateEmpForm] = useState(false);

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
  };

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

        if (emp.status === "fulfilled") {
          const empData = emp.value.data;
          if (Array.isArray(empData)) setEmployees(empData);
          else if (empData && typeof empData === "object")
            setEmployees(empData.data || empData.employees || []);
        }
        if (r.status === "fulfilled") {
          const rData = r.value.data;
          if (Array.isArray(rData)) setRoles(rData);
          else if (rData && typeof rData === "object")
            setRoles(rData.data || rData.roles || []);
        }
        if (s.status === "fulfilled") {
          const sData = s.value.data;
          if (Array.isArray(sData)) setShops(sData);
          else if (sData && typeof sData === "object")
            setShops(sData.data || sData.shops || []);
        }
        if (p.status === "fulfilled") {
          const pData = p.value.data;
          let productList = [];
          if (Array.isArray(pData)) productList = pData;
          else if (pData && typeof pData === "object")
            productList = pData.data || pData.products || [];

          setProducts(productList);

          // extract unique categories from products
          const cats = {};
          const ingreds = {};
          productList.forEach((prod) => {
            if (prod.theLoai && prod.theLoai.theLoaiId) {
              cats[prod.theLoai.theLoaiId] = prod.theLoai;
            }
            if (prod.nguyenLieu && prod.nguyenLieu.nguyenLieuId) {
              ingreds[prod.nguyenLieu.nguyenLieuId] = prod.nguyenLieu;
            }
          });
          setCategories(Object.values(cats));
          setIngredients(Object.values(ingreds));
        }
        if (d.status === "fulfilled") {
          const dData = d.value.data;
          if (Array.isArray(dData)) setDiscounts(dData);
          else if (dData && typeof dData === "object")
            setDiscounts(dData.data || dData.discounts || []);
        }
        if (pt.status === "fulfilled") {
          const ptData = pt.value.data;
          if (Array.isArray(ptData)) setPartners(ptData);
          else if (ptData && typeof ptData === "object")
            setPartners(ptData.data || ptData.partners || []);
        }
      } catch (e) {
        handleApiError(e);
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, [authHeaders]);

  const overviewCards = [
    {
      label: "Tổng nhân viên",
      value: employees.length,
      color: "text-green-600",
      bg: "bg-green-100",
      roles: ["Admin", "HR"],
    },
    {
      label: "Số cửa hàng",
      value: shops.length,
      color: "text-yellow-600",
      bg: "bg-yellow-100",
      roles: ["Admin", "StoreManager", "AreaManager"],
    },
    {
      label: "Sản phẩm",
      value: products.length,
      color: "text-orange-500",
      bg: "bg-orange-100",
      roles: ["Admin", "StoreManager", "AreaManager"],
    },
    {
      label: "Mã giảm giá",
      value: discounts.length,
      color: "text-blue-500",
      bg: "bg-blue-100",
      roles: ["Admin", "StoreManager", "AreaManager"],
    },
    {
      label: "Đối tác",
      value: partners.length,
      color: "text-rose-500",
      bg: "bg-rose-100",
      roles: ["Admin", "Production"],
    },
    {
      label: "Chức vụ",
      value: roles.length,
      color: "text-teal-500",
      bg: "bg-teal-100",
      roles: ["Admin", "HR"],
    },
  ];

  const filteredOverviewCards = overviewCards.filter((card) =>
    card.roles.includes(role),
  );

  const handleResetEmployees = async () => {
    try {
      setLoading(true);
      setError("");
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
      setError("");
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
      if (!id) throw new Error("Không xác định được mã nhân viên");

      await api.put(`/admin/Employee/admin-update/${id}`, form, {
        headers: authHeaders,
      });
      const updated = await api.get("/admin/Employee", {
        headers: authHeaders,
      });
      if (Array.isArray(updated.data)) setEmployees(updated.data);
      alert("Cập nhật thành công!");
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
      setError("");
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
      if (err?.response?.status === 404) {
        setEmployees([]);
        setError("");
      } else handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEmployee = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa nhân viên này?")) return;
    try {
      setLoading(true);
      setError("");
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

  const filteredProducts = useMemo(() => {
    if (!searchProduct) return products;
    return products.filter((p) =>
      (p.sanPhamName || "").toLowerCase().includes(searchProduct.toLowerCase()),
    );
  }, [products, searchProduct]);

  const filteredShops = useMemo(() => {
    if (!searchShop) return shops;
    return shops.filter((s) =>
      (s.shopName || "").toLowerCase().includes(searchShop.toLowerCase()),
    );
  }, [shops, searchShop]);

  const filteredPartners = useMemo(() => {
    if (!searchPartner) return partners;
    return partners.filter((p) =>
      (p.name || "").toLowerCase().includes(searchPartner.toLowerCase()),
    );
  }, [partners, searchPartner]);

  const handleCreateRole = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");
      const form = new FormData();
      form.append("name", newRole.name);
      form.append("description", newRole.description);
      await api.post("/admin/Role", form, { headers: authHeaders });
      // refresh list using current search filter if any
      await handleSearchRole(searchRoleKey);
      setNewRole({ name: "", description: "" });
      alert("Tạo chức vụ thành công!");
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

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
      setError("");
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
      setError("");
      await api.delete(`/admin/Role?id=${id}`, { headers: authHeaders });
      await handleSearchRole(searchRoleKey);
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  // Hàm tự động lấy tọa độ khi nhập địa chỉ (Geocoding)
  const handleFetchCoords = async () => {
    if (!newShop.address) return;
    try {
      const query = `${newShop.address}, ${newShop.city}, Việt Nam`;
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`,
      );
      const data = await res.json();
      if (data.length > 0) {
        setNewShop((prev) => ({
          ...prev,
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon),
        }));
        toast.success("Đã tìm thấy tọa độ!");
      } else {
        toast.error("Không tìm thấy địa chỉ này trên bản đồ");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFetchCoordsEdit = async () => {
    if (!editingShop.address) return;
    try {
      const query = `${editingShop.address}, ${editingShop.city}, Việt Nam`;
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`,
      );
      const data = await res.json();
      if (data.length > 0) {
        setEditingShop((prev) => ({
          ...prev,
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon),
        }));
        alert("Đã tìm thấy tọa độ!"); // Dùng alert hoặc toast tùy bạn
      } else {
        alert("Không tìm thấy địa chỉ này trên bản đồ");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateShop = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");

      // Tự động lấy tọa độ từ địa chỉ trước khi gửi về Backend
      const coords = await getCoordinatesFromAddress(
        newShop.address,
        newShop.city,
      );

      const form = new FormData();
      form.append("name", newShop.name);
      form.append("phone", newShop.phone);
      form.append("address", newShop.address);
      form.append("city", newShop.city);

      // Gửi tọa độ nếu tìm thấy
      if (coords) {
        form.append("latitude", coords.lat);
        form.append("longitude", coords.lon);
      }
      form.append("BanKinhChoPhep", newShop.allowedRadius || 50);
      await api.post("/admin/ShopInfo", form, { headers: authHeaders });
      await handleSearchShop(searchShopKey);
      setNewShop({ name: "", phone: "", address: "", city: "" });
      alert(
        coords
          ? "Tạo thành công (Đã xác định tọa độ)!"
          : "Tạo thành công (Chưa lấy được tọa độ)!",
      );
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchShop = async (key) => {
    try {
      setLoading(true);
      const url = key
        ? `/admin/ShopInfo/search-by-name?key=${encodeURIComponent(key)}`
        : "/admin/ShopInfo";
      const res = await api.get(url, { headers: authHeaders });
      const data = res.data;
      if (Array.isArray(data)) setShops(data);
      else if (data && typeof data === "object")
        setShops(data.data || data.shops || []);
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditShop = (shop) => {
    setEditingShop({
      id: shop.cuaHangId || shop.shopId || shop.id,
      name: shop.shopName || "",
      phone: shop.shopPhone || "",
      address: shop.shopAddress || "",
      city: shop.shopCity || "",
      // Lấy thêm 3 trường này từ DB lên Form
      latitude: shop.latitude || null,
      longitude: shop.longitude || null,
      allowedRadius: shop.banKinhChoPhep || 50, // Ánh xạ từ DB (banKinhChoPhep) vào state (allowedRadius)
    });
  };

  const handleUpdateShop = async (e) => {
    e.preventDefault();
    if (!editingShop) return;
    try {
      setLoading(true);
      setError("");

      // Lấy tọa độ mới dựa trên địa chỉ mới cập nhật
      const coords = await getCoordinatesFromAddress(
        editingShop.address,
        editingShop.city,
      );

      const body = {
        name: editingShop.name,
        phone: editingShop.phone,
        address: editingShop.address,
        city: editingShop.city,
        latitude: coords ? coords.lat : editingShop.latitude,
        longitude: coords ? coords.lon : editingShop.longitude,
        BanKinhChoPhep: editingShop.allowedRadius || 50,
      };

      await api.put(`/admin/ShopInfo/shop-update/${editingShop.id}`, body, {
        headers: { ...authHeaders, "Content-Type": "application/json" },
      });

      await handleSearchShop(searchShopKey);
      setEditingShop(null);
      alert("Cập nhật thành công!");
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteShop = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa cửa hàng này?")) return;
    try {
      setLoading(true);
      setError("");
      await api.delete(`/admin/ShopInfo?id=${id}`, { headers: authHeaders });
      await handleSearchShop(searchShopKey);
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePartner = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");
      const form = new FormData();
      form.append("name", newPartner.name);
      form.append("phone", newPartner.phone);
      form.append("email", newPartner.email);
      form.append("address", newPartner.address);
      await api.post("/DoiTac", form, { headers: authHeaders });
      const updated = await api.get("/DoiTac", { headers: authHeaders });
      if (Array.isArray(updated.data)) setPartners(updated.data);
      setNewPartner({ name: "", phone: "", email: "", address: "" });
      alert("Tạo đối tác thành công!");
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchPartner = async (key) => {
    try {
      setLoading(true);
      const url = key
        ? `/DoiTac/search_by_name?key=${encodeURIComponent(key)}`
        : "/DoiTac";
      const res = await api.get(url, { headers: authHeaders });
      const data = res.data;
      if (Array.isArray(data)) setPartners(data);
      else if (data && typeof data === "object")
        setPartners(data.data || data.partners || []);
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditPartner = (partner) => {
    setEditingPartner({
      id: partner.id,
      name: partner.name || "",
      phone: partner.phone || "",
      email: partner.email || "",
      address: partner.address || "",
    });
  };

  const handleUpdatePartner = async (e) => {
    e.preventDefault();
    if (!editingPartner) return;
    try {
      setLoading(true);
      setError("");
      const form = new FormData();
      form.append("name", editingPartner.name);
      form.append("phone", editingPartner.phone);
      form.append("email", editingPartner.email);
      form.append("address", editingPartner.address);
      await api.put(`/DoiTac?id=${editingPartner.id}`, form, {
        headers: authHeaders,
      });
      await handleSearchPartner(searchPartnerKey);
      setEditingPartner(null);
      alert("Cập nhật đối tác thành công!");
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePartner = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa đối tác này?")) return;
    try {
      setLoading(true);
      setError("");
      await api.delete(`/DoiTac?id=${id}`, { headers: authHeaders });
      await handleSearchPartner(searchPartnerKey);
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDiscount = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");
      const form = new FormData();
      form.append("Code", newDiscount.Code);
      form.append("LoaiMa", newDiscount.LoaiMa);
      form.append("MaxValue", newDiscount.MaxValue.toString());
      form.append("SoLuong", newDiscount.SoLuong.toString());
      form.append("NgayBatDau", newDiscount.NgayBatDau);
      form.append("NgayKetThuc", newDiscount.NgayKetThuc);
      await api.post("/admin/Discount", form, { headers: authHeaders });
      const updated = await api.get("/admin/Discount", {
        headers: authHeaders,
      });
      if (Array.isArray(updated.data)) setDiscounts(updated.data);
      setNewDiscount({
        Code: "",
        LoaiMa: "Persent",
        MaxValue: "",
        SoLuong: "",
        NgayBatDau: "",
        NgayKetThuc: "",
      });
      alert("Tạo mã giảm giá thành công!");
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchDiscount = async (key) => {
    try {
      setLoading(true);
      const url = key
        ? `/admin/Discount/search-discount-by-code?code=${encodeURIComponent(key)}`
        : "/admin/Discount";
      const res = await api.get(url, { headers: authHeaders });
      const data = res.data;
      if (Array.isArray(data)) setDiscounts(data);
      else if (data && typeof data === "object")
        setDiscounts(data.data || data.discounts || []);
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditDiscount = (discount) => {
    setEditingDiscount({
      id: discount.id,
      code: discount.code || discount.Code || "",
      loaiMa: discount.loaiMa || discount.LoaiMa || "Persent",
      maxValue: discount.maxValue || discount.MaxValue || 0,
      soLuong: discount.soLuong || discount.SoLuong || 0,
      ngayBatDau: discount.ngayBatDau || discount.NgayBatDau || "",
      ngayKetThuc: discount.ngayKetThuc || discount.NgayKetThuc || "",
    });
  };

  const handleUpdateDiscount = async (e) => {
    e.preventDefault();
    if (!editingDiscount) return;
    try {
      setLoading(true);
      setError("");
      const form = new FormData();
      form.append("Code", editingDiscount.code);
      form.append("LoaiMa", editingDiscount.loaiMa);
      form.append("MaxValue", editingDiscount.maxValue.toString());
      form.append("SoLuong", editingDiscount.soLuong.toString());
      form.append("NgayBatDau", editingDiscount.ngayBatDau);
      form.append("NgayKetThuc", editingDiscount.ngayKetThuc);
      await api.put(
        `/admin/Discount/discount-update/${editingDiscount.id}`,
        form,
        {
          headers: authHeaders,
        },
      );
      await handleSearchDiscount(searchDiscountKey);
      setEditingDiscount(null);
      alert("Cập nhật mã giảm giá thành công!");
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDiscount = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa mã giảm giá này?")) return;
    try {
      setLoading(true);
      setError("");
      await api.delete(`/admin/Discount?id=${id}`, { headers: authHeaders });
      await handleSearchDiscount(searchDiscountKey);
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");
      const form = new FormData();
      form.append("SanPhamName", newProduct.SanPhamName);
      form.append("TheLoaiId", newProduct.TheLoaiId);
      form.append("NguyenLieuId", newProduct.NguyenLieuId || 0);
      form.append("Size", newProduct.Size);
      form.append("MoTa", newProduct.MoTa);
      form.append("GiaBan", newProduct.GiaBan);
      form.append("IsActive", newProduct.IsActive ? "true" : "false");
      if (newProduct.HinhAnhUpload)
        form.append("HinhAnhUpload", newProduct.HinhAnhUpload);
      await api.post("/admin/Product", form, { headers: authHeaders });
      const updated = await api.get("/admin/Product", { headers: authHeaders });
      if (Array.isArray(updated.data)) setProducts(updated.data);
      setNewProduct({
        SanPhamName: "",
        TheLoaiId: "",
        NguyenLieuId: "",
        Size: "",
        MoTa: "",
        GiaBan: "",
        IsActive: true,
        HinhAnhUpload: null,
      });
      alert("Tạo sản phẩm thành công!");
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchProduct = async (key) => {
    try {
      setLoading(true);
      const url = key
        ? `/admin/Product/search-by-name?keyword=${encodeURIComponent(key)}`
        : "/admin/Product";
      const res = await api.get(url, { headers: authHeaders });
      const data = res.data;
      if (Array.isArray(data)) setProducts(data);
      else if (data && typeof data === "object")
        setProducts(data.data || data.products || []);
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct({
      id: product.sanPhamId || product.id,
      name: product.sanPhamName || "",
      theLoaiId: product.theLoaiId || product.TheLoaiId || "",
      nguyenLieuId: product.nguyenLieuId || product.NguyenLieuId || "",
      size: product.size || product.Size || "",
      mota: product.mota || product.MoTa || "",
      giaBan: product.giaBan || product.GiaBan || "",
      isActive: product.isActive ?? product.IsActive ?? true,
      hinhAnhUpload: null,
      hinhAnh: product.hinhAnh || product.HinhAnh || "",
    });
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      setLoading(true);
      setError("");
      const form = new FormData();
      form.append("SanPhamName", editingProduct.name);
      form.append("TheLoaiId", editingProduct.theLoaiId);
      form.append("NguyenLieuId", editingProduct.nguyenLieuId || 0);
      form.append("Size", editingProduct.size);
      form.append("MoTa", editingProduct.mota);
      form.append("GiaBan", editingProduct.giaBan);
      form.append("IsActive", editingProduct.isActive ? "true" : "false");
      if (editingProduct.hinhAnhUpload)
        form.append("HinhAnhUpload", editingProduct.hinhAnhUpload);
      await api.put(`/admin/Product/${editingProduct.id}`, form, {
        headers: authHeaders,
      });
      await handleSearchProduct(searchProductKey);
      setEditingProduct(null);
      alert("Cập nhật sản phẩm thành công!");
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa sản phẩm này?")) return;
    try {
      setLoading(true);
      setError("");
      await api.delete(`/admin/Product/${id}`, { headers: authHeaders });
      await handleSearchProduct(searchProductKey);
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadKho = async () => {
    if (!khoShopId) return;
    try {
      setLoading(true);
      setError("");
      const res = await api.get(`/Admin/Kho/get_by_shop/${khoShopId}`, {
        headers: authHeaders,
      });
      if (Array.isArray(res.data)) setInventory(res.data);
      else setInventory([]);
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-800">Tổng quan hệ thống</h2>
        <p className="text-sm text-gray-500 mt-1">
          Thống kê nhanh các module quản trị nội bộ.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        {filteredOverviewCards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl bg-white border border-green-100 p-5 shadow-sm text-center"
          >
            <div
              className={`w-12 h-12 mx-auto rounded-full ${card.bg} flex items-center justify-center mb-3`}
            >
              <span className={`text-xl font-bold ${card.color}`}>
                {card.value}
              </span>
            </div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {card.label}
            </p>
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {(role === "Admin" || role === "HR") && (
          <section className="rounded-2xl bg-white border border-green-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <span className="text-green-500">🧑‍🍳</span> Nhân viên mới
              </h3>
            </div>
            <div className="overflow-x-auto text-sm">
              <table className="min-w-full text-left">
                <thead className="text-xs uppercase text-green-700 bg-green-50 rounded-xl">
                  <tr>
                    <th className="py-3 px-4 rounded-l-xl">Tên</th>
                    <th className="py-3 px-4">Chức vụ</th>
                    <th className="py-3 px-4 rounded-r-xl">Cửa hàng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {employees.slice(0, 5).map((e, index) => (
                    <tr
                      key={e.taiKhoanNoiBoId || e.id || `emp-overview-${index}`}
                      className="hover:bg-gray-50"
                    >
                      <td className="py-3 px-4 text-gray-800 font-medium">
                        {e.tenNhanVien}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {e.chucVu?.chucVuName}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {e.cuaHang?.shopName}
                      </td>
                    </tr>
                  ))}
                  {employees.length === 0 && (
                    <tr>
                      <td
                        colSpan={3}
                        className="py-4 text-center text-gray-500 text-xs"
                      >
                        Chưa có dữ liệu nhân viên.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
        {(role === "Admin" ||
          role === "StoreManager" ||
          role === "AreaManager") && (
          <section className="rounded-2xl bg-white border border-yellow-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <span className="text-yellow-500">🍲</span> Sản phẩm mới
              </h3>
            </div>
            <div className="overflow-x-auto text-sm">
              <table className="min-w-full text-left">
                <thead className="text-xs uppercase text-yellow-700 bg-yellow-50 rounded-xl">
                  <tr>
                    <th className="py-3 px-4 rounded-l-xl">Tên món</th>
                    <th className="py-3 px-4">Thể loại</th>
                    <th className="py-3 px-4 rounded-r-xl">Giá bán</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.slice(0, 5).map((p, index) => (
                    <tr
                      key={p.sanPhamId || p.id || `product-overview-${index}`}
                      className="hover:bg-gray-50"
                    >
                      <td className="py-3 px-4 text-gray-800 font-medium">
                        {p.sanPhamName}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {p.theLoai?.theLoaiName}
                      </td>
                      <td className="py-3 px-4 text-green-600 font-bold">
                        {p.giaBan?.toLocaleString("vi-VN")}₫
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && (
                    <tr>
                      <td
                        colSpan={3}
                        className="py-4 text-center text-gray-500 text-xs"
                      >
                        Chưa có dữ liệu sản phẩm.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );

  const renderEmployees = () => (
    <div className="space-y-4">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between bg-white p-4 rounded-2xl shadow-sm border border-green-100">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Quản lý nhân viên</h2>
          <p className="text-sm text-gray-500 mt-1">
            Tra cứu và cập nhật thông tin nội bộ.
          </p>
        </div>
        <form
          onSubmit={handleSearchEmployee}
          className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center"
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
            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 sm:min-w-[200px]"
            value={searchEmployee}
            onChange={(e) => setSearchEmployee(e.target.value)}
          />
          <div className="flex gap-2">
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
              className="px-4 py-2 rounded-xl bg-yellow-400 text-sm font-bold text-yellow-900 shadow-sm hover:bg-yellow-500 transition"
            >
              {showCreateEmpForm ? "Đóng Form" : "+ Thêm NV"}
            </button>
          </div>
        </form>
      </header>

      {showCreateEmpForm && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-green-200">
          <CreateEmployeeForm
            roles={roles}
            shops={shops}
            onSuccess={handleEmployeeCreated}
          />
        </div>
      )}

      <div className="rounded-2xl bg-white border border-green-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto text-sm">
          <table className="min-w-full text-left">
            <thead className="text-xs uppercase font-bold text-green-700 bg-green-50 border-b border-green-100">
              <tr>
                <th className="py-3 px-4">Ảnh</th>
                <th className="py-3 px-4">Tên</th>
                <th className="py-3 px-4">Tài khoản</th>
                <th className="py-3 px-4">Chức vụ</th>
                <th className="py-3 px-4">Cửa hàng</th>
                <th className="py-3 px-4">SĐT</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {employees.map((e, index) => (
                <tr
                  key={e.taiKhoanNoiBoId || e.id || `emp-${index}`}
                  className="hover:bg-green-50/50 cursor-pointer transition"
                  onClick={() => openEmployeeDetail(e)}
                >
                  <td className="py-3 px-4">
                    {e.avatar || e.avatarUrl ? (
                      <img
                        src={getAvatarUrl(e.avatar || e.avatarUrl)}
                        alt={e.tenNhanVien || "avatar"}
                        className="h-10 w-10 rounded-full object-cover border border-green-200"
                        onError={(ev) => {
                          console.error("Avatar load failed:", ev);
                          ev.target.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-sm font-bold text-green-600">
                        {e.tenNhanVien?.charAt(0)?.toUpperCase() || "NV"}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-gray-800 font-semibold">
                    {e.tenNhanVien}
                  </td>
                  <td className="py-3 px-4 text-gray-500">{e.tenTaiKhoan}</td>
                  <td className="py-3 px-4 text-gray-600">
                    <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded-lg text-xs font-semibold">
                      {e.chucVu?.chucVuName}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {e.cuaHang?.shopName}
                  </td>
                  <td className="py-3 px-4 text-gray-600">{e.sdt}</td>
                  <td className="py-3 px-4 text-gray-600">{e.email}</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={(ev) => {
                        ev.stopPropagation();
                        handleDeleteEmployee(e.taiKhoanNoiBoId || e.id);
                      }}
                      className="text-red-500 hover:text-red-700 font-semibold bg-red-50 px-3 py-1 rounded-lg"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
              {employees.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="py-4 text-center text-gray-500 text-sm"
                  >
                    Không có nhân viên phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Khung Update được chiếm toàn bộ width do đã xóa box đổi Avatar */}
      <div className="w-full">
        <section className="rounded-2xl bg-white border border-yellow-200 p-6 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-gray-800">
            Cập nhật thông tin nhân viên
          </h3>
          {selectedEmployee ? (
            <form className="space-y-4 text-sm" onSubmit={handleUpdateEmployee}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-600">
                    Họ tên
                  </label>
                  <input
                    type="text"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={employeeForm.name}
                    onChange={(e) =>
                      setEmployeeForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-600">
                    Tên đăng nhập
                  </label>
                  <input
                    type="text"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={employeeForm.tenDangNhap}
                    onChange={(e) =>
                      setEmployeeForm((prev) => ({
                        ...prev,
                        tenDangNhap: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-600">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={employeeForm.sdt}
                    onChange={(e) =>
                      setEmployeeForm((prev) => ({
                        ...prev,
                        sdt: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-600">
                    Email
                  </label>
                  <input
                    type="email"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={employeeForm.email}
                    onChange={(e) =>
                      setEmployeeForm((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-600">
                    Ngày sinh
                  </label>
                  <input
                    type="date"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={employeeForm.ngaySinh}
                    onChange={(e) =>
                      setEmployeeForm((prev) => ({
                        ...prev,
                        ngaySinh: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-600">
                    Giới tính
                  </label>
                  <select
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={employeeForm.gioiTinh}
                    onChange={(e) =>
                      setEmployeeForm((prev) => ({
                        ...prev,
                        gioiTinh: e.target.value,
                      }))
                    }
                  >
                    <option value="">Không đổi</option>
                    <option value="true">Nam</option>
                    <option value="false">Nữ</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-600">
                    Chức vụ
                  </label>
                  <select
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={employeeForm.chucVuId}
                    onChange={(e) =>
                      setEmployeeForm((prev) => ({
                        ...prev,
                        chucVuId: e.target.value,
                      }))
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
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={employeeForm.cuaHangId}
                    onChange={(e) =>
                      setEmployeeForm((prev) => ({
                        ...prev,
                        cuaHangId: e.target.value,
                      }))
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
              <div className="flex items-center justify-between gap-3 pt-2">
                <span className="text-xs text-gray-400">
                  Đang chỉnh sửa nhân viên mã{" "}
                  {selectedEmployee.taiKhoanNoiBoId || selectedEmployee.id}
                </span>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl bg-yellow-400 text-sm font-bold text-yellow-900 hover:bg-yellow-500 shadow-sm disabled:opacity-60 transition"
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
  );

  const renderRoles = () => (
    <div className="grid gap-6 lg:grid-cols-[1.2fr,1fr]">
      <section className="space-y-4">
        <header>
          <h2 className="text-xl font-bold text-gray-800">Quản lý chức vụ</h2>
          <p className="text-sm text-gray-500 mt-1">
            Danh sách các chức vụ nội bộ.
          </p>
        </header>
        {/* search box */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Tìm theo tên"
            className="w-full max-w-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
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
                  <th className="py-3 px-4">&nbsp;</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {roles.map((r, index) => (
                  <tr
                    key={r.chucVuId || r.id || `role-${index}`}
                    className="hover:bg-gray-50 transition"
                  >
                    <td className="py-3 px-4 text-gray-800 font-semibold">
                      {r.chucVuName}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {r.chucVuDescription}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        className="text-blue-500 hover:underline mr-2"
                        onClick={() => handleEditRole(r)}
                      >
                        Sửa
                      </button>
                      <button
                        className="text-red-500 hover:underline"
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
                      className="py-4 text-center text-gray-500 text-sm"
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
      <section className="rounded-2xl bg-white border border-green-100 p-6 shadow-sm space-y-4">
        {editingRole ? (
          <>
            <h3 className="text-lg font-bold text-gray-800">
              Chỉnh sửa chức vụ
            </h3>
            <form className="space-y-4 text-sm" onSubmit={handleUpdateRole}>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">
                  Tên chức vụ
                </label>
                <input
                  type="text"
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={editingRole.name}
                  onChange={(e) =>
                    setEditingRole((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">
                  Mô tả
                </label>
                <textarea
                  rows={3}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={editingRole.description}
                  onChange={(e) =>
                    setEditingRole((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-3 rounded-xl bg-green-500 text-sm font-bold text-white hover:bg-green-600 disabled:opacity-60 shadow-sm transition"
                >
                  Cập nhật
                </button>
                <button
                  type="button"
                  className="flex-1 px-4 py-3 rounded-xl bg-gray-300 text-sm font-bold text-gray-700 hover:bg-gray-400 shadow-sm"
                  onClick={() => setEditingRole(null)}
                >
                  Hủy
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <h3 className="text-lg font-bold text-gray-800">
              Thêm chức vụ mới
            </h3>
            <form className="space-y-4 text-sm" onSubmit={handleCreateRole}>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">
                  Tên chức vụ
                </label>
                <input
                  type="text"
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={newRole.name}
                  onChange={(e) =>
                    setNewRole((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">
                  Mô tả
                </label>
                <textarea
                  rows={3}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={newRole.description}
                  onChange={(e) =>
                    setNewRole((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-3 rounded-xl bg-green-500 text-sm font-bold text-white hover:bg-green-600 disabled:opacity-60 shadow-sm transition"
              >
                Lưu chức vụ
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );

  const renderShops = () => (
    <div className="grid gap-6 lg:grid-cols-[1.3fr,1fr]">
      <section className="space-y-4">
        <header>
          <h2 className="text-xl font-bold text-gray-800">Quản lý cửa hàng</h2>
          <p className="text-sm text-gray-500 mt-1">Danh sách các chi nhánh.</p>
        </header>
        {/* search box */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Tìm theo tên"
            className="w-full max-w-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            value={searchShopKey}
            onChange={(e) => {
              setSearchShopKey(e.target.value);
              handleSearchShop(e.target.value);
            }}
          />
        </div>
        <div className="rounded-2xl bg-white border border-green-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto text-sm">
            <table className="min-w-full text-left">
              <thead className="text-xs uppercase font-bold text-green-700 bg-green-50 border-b border-green-100">
                <tr>
                  <th className="py-3 px-4">Tên cửa hàng</th>
                  <th className="py-3 px-4">SĐT</th>
                  <th className="py-3 px-4">Địa chỉ</th>
                  <th className="py-3 px-4">Thành phố</th>
                  <th className="py-3 px-4">&nbsp;</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {shops.map((s, index) => (
                  <tr
                    key={s.cuaHangId || s.shopId || s.id || `shop-${index}`}
                    className="hover:bg-gray-50 transition"
                  >
                    <td className="py-3 px-4 text-gray-800 font-semibold">
                      {s.shopName}
                    </td>
                    <td className="py-3 px-4 text-gray-600">{s.shopPhone}</td>
                    <td className="py-3 px-4 text-gray-600">{s.shopAddress}</td>
                    <td className="py-3 px-4 text-gray-600">{s.shopCity}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        className="text-blue-500 hover:underline mr-2"
                        onClick={() => handleEditShop(s)}
                      >
                        Sửa
                      </button>
                      <button
                        className="text-red-500 hover:underline"
                        onClick={() =>
                          handleDeleteShop(s.cuaHangId || s.shopId || s.id)
                        }
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
                {shops.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-4 text-center text-gray-500 text-sm"
                    >
                      Không có cửa hàng phù hợp.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
      <section className="rounded-2xl bg-white border border-green-100 p-6 shadow-sm space-y-4">
        {editingShop ? (
          <>
            <h3 className="text-lg font-bold text-gray-800">
              Chỉnh sửa cửa hàng
            </h3>
            <form className="space-y-4 text-sm" onSubmit={handleUpdateShop}>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">
                  Tên cửa hàng
                </label>
                <input
                  type="text"
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={editingShop.name}
                  onChange={(e) =>
                    setEditingShop((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={editingShop.phone}
                  onChange={(e) =>
                    setEditingShop((prev) => ({
                      ...prev,
                      phone: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">
                  Địa chỉ
                </label>
                <input
                  type="text"
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={editingShop.address}
                  onChange={(e) =>
                    setEditingShop((prev) => ({
                      ...prev,
                      address: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">
                  Thành phố
                </label>
                <input
                  type="text"
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={editingShop.city}
                  onChange={(e) =>
                    setEditingShop((prev) => ({
                      ...prev,
                      city: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4 mt-6 p-4 bg-green-50 rounded-2xl border border-dashed border-green-200">
                <div className="col-span-2 flex justify-between items-center">
                  <span className="text-sm font-bold text-green-800 flex items-center gap-2">
                    📍 Xác thực vị trí cửa hàng
                  </span>
                  <button
                    type="button"
                    onClick={handleFetchCoordsEdit}
                    className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 shadow-sm transition"
                  >
                    Lấy tọa độ từ địa chỉ
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] uppercase font-bold text-gray-400 mb-1">
                    Kinh độ (Lat)
                  </label>
                  <input
                    readOnly
                    value={editingShop.latitude || "Chưa xác định"}
                    className="w-full bg-white border border-gray-200 p-2 rounded-xl font-mono text-sm text-blue-600 shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase font-bold text-gray-400 mb-1">
                    Vĩ độ (Lng)
                  </label>
                  <input
                    readOnly
                    value={editingShop.longitude || "Chưa xác định"}
                    className="w-full bg-white border border-gray-200 p-2 rounded-xl font-mono text-sm text-blue-600 shadow-sm"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Bán kính chấm công (mét)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={editingShop.allowedRadius || 50}
                      onChange={(e) =>
                        setEditingShop({
                          ...editingShop,
                          allowedRadius: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-32 border border-gray-200 p-2 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                      placeholder="50"
                    />
                    <span className="text-xs text-gray-500 italic">
                      (Nhân viên phải đứng trong khoảng{" "}
                      {editingShop.allowedRadius || 50}m tính từ tâm cửa hàng)
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-3 rounded-xl bg-green-500 text-sm font-bold text-white hover:bg-green-600 disabled:opacity-60 shadow-sm transition"
                >
                  Cập nhật
                </button>
                <button
                  type="button"
                  className="flex-1 px-4 py-3 rounded-xl bg-gray-300 text-sm font-bold text-gray-700 hover:bg-gray-400 shadow-sm"
                  onClick={() => setEditingShop(null)}
                >
                  Hủy
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <h3 className="text-lg font-bold text-gray-800">
              Thêm cửa hàng mới
            </h3>
            <form className="space-y-4 text-sm" onSubmit={handleCreateShop}>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">
                  Tên cửa hàng
                </label>
                <input
                  type="text"
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={newShop.name}
                  onChange={(e) =>
                    setNewShop((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={newShop.phone}
                  onChange={(e) =>
                    setNewShop((prev) => ({ ...prev, phone: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">
                  Địa chỉ
                </label>
                <input
                  type="text"
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={newShop.address}
                  onChange={(e) =>
                    setNewShop((prev) => ({ ...prev, address: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">
                  Thành phố
                </label>
                <input
                  type="text"
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={newShop.city}
                  onChange={(e) =>
                    setNewShop((prev) => ({ ...prev, city: e.target.value }))
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4 mt-6 p-4 bg-green-50 rounded-2xl border border-dashed border-green-200">
                <div className="col-span-2 flex justify-between items-center">
                  <span className="text-sm font-bold text-green-800 flex items-center gap-2">
                    📍 Xác thực vị trí cửa hàng
                  </span>
                  <button
                    type="button"
                    onClick={handleFetchCoords}
                    className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 shadow-sm transition"
                  >
                    Lấy tọa độ từ địa chỉ
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] uppercase font-bold text-gray-400 mb-1">
                    Kinh độ (Lat)
                  </label>
                  <input
                    readOnly
                    value={newShop.latitude || "Chưa xác định"}
                    className="w-full bg-white border border-gray-200 p-2 rounded-xl font-mono text-sm text-blue-600 shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase font-bold text-gray-400 mb-1">
                    Vĩ độ (Lng)
                  </label>
                  <input
                    readOnly
                    value={newShop.longitude || "Chưa xác định"}
                    className="w-full bg-white border border-gray-200 p-2 rounded-xl font-mono text-sm text-blue-600 shadow-sm"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Bán kính chấm công (mét)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={newShop.allowedRadius}
                      onChange={(e) =>
                        setNewShop({
                          ...newShop,
                          allowedRadius: parseInt(e.target.value),
                        })
                      }
                      className="w-32 border border-gray-200 p-2 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                      placeholder="50"
                    />
                    <span className="text-xs text-gray-500 italic">
                      (Nhân viên phải đứng trong khoảng {newShop.allowedRadius}m
                      tính từ tâm cửa hàng)
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-3 rounded-xl bg-green-500 text-sm font-bold text-white hover:bg-green-600 disabled:opacity-60 shadow-sm transition"
              >
                Lưu cửa hàng
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );

  const renderProducts = () => (
    <div className="grid gap-6 xl:grid-cols-[1.4fr,1fr]">
      <section className="space-y-4">
        <header>
          <h2 className="text-xl font-bold text-gray-800">Quản lý sản phẩm</h2>
          <p className="text-sm text-gray-500 mt-1">
            Danh sách món ăn/đồ uống.
          </p>
        </header>
        {/* search box */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Tìm theo tên sản phẩm"
            className="w-full max-w-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            value={searchProductKey}
            onChange={(e) => {
              setSearchProductKey(e.target.value);
              handleSearchProduct(e.target.value);
            }}
          />
        </div>
        <div className="rounded-2xl bg-white border border-green-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto text-sm">
            <table className="min-w-full text-left">
              <thead className="text-xs uppercase font-bold text-green-700 bg-green-50 border-b border-green-100">
                <tr>
                  <th className="py-3 px-4">Tên sản phẩm</th>
                  <th className="py-3 px-4">Thể loại</th>
                  <th className="py-3 px-4">Size</th>
                  <th className="py-3 px-4">Giá bán</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4">&nbsp;</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((p, index) => (
                  <tr
                    key={p.sanPhamId || p.id || `product-list-${index}`}
                    className="hover:bg-gray-50 transition"
                  >
                    <td className="py-3 px-4 text-gray-800 font-semibold">
                      {p.sanPhamName}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {p.theLoai?.theLoaiName}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {p.size || p.Size}
                    </td>
                    <td className="py-3 px-4 text-green-600 font-bold">
                      {(p.giaBan || p.GiaBan)?.toLocaleString("vi-VN")}₫
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold ${
                          p.isActive || p.IsActive
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {p.isActive || p.IsActive ? "Đang bán" : "Ngưng bán"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        className="text-blue-500 hover:underline mr-2"
                        onClick={() => handleEditProduct(p)}
                      >
                        Sửa
                      </button>
                      <button
                        className="text-red-500 hover:underline"
                        onClick={() => handleDeleteProduct(p.sanPhamId || p.id)}
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-4 text-center text-gray-500 text-sm"
                    >
                      Không có sản phẩm phù hợp.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
      <section className="rounded-2xl bg-white border border-green-100 p-6 shadow-sm space-y-4">
        {editingProduct ? (
          <>
            <h3 className="text-lg font-bold text-gray-800">
              Chỉnh sửa sản phẩm
            </h3>
            <form className="space-y-3 text-sm" onSubmit={handleUpdateProduct}>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">
                  Tên sản phẩm
                </label>
                <input
                  type="text"
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={editingProduct.name}
                  onChange={(e) =>
                    setEditingProduct((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700">
                    Thể loại
                  </label>
                  <select
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={editingProduct.theLoaiId}
                    onChange={(e) =>
                      setEditingProduct((prev) => ({
                        ...prev,
                        theLoaiId: e.target.value,
                      }))
                    }
                  >
                    <option value="">Chọn thể loại</option>
                    {categories.map((cat) => (
                      <option
                        key={cat.theLoaiId || cat.id}
                        value={cat.theLoaiId || cat.id}
                      >
                        {cat.theLoaiName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700">
                    Nguyên liệu
                  </label>
                  <select
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={editingProduct.nguyenLieuId}
                    onChange={(e) =>
                      setEditingProduct((prev) => ({
                        ...prev,
                        nguyenLieuId: e.target.value,
                      }))
                    }
                  >
                    <option value="">Không chọn</option>
                    {ingredients.map((ing) => (
                      <option
                        key={ing.nguyenLieuId || ing.id}
                        value={ing.nguyenLieuId || ing.id}
                      >
                        {ing.nguyenLieuName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700">
                    Size
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={editingProduct.size}
                    onChange={(e) =>
                      setEditingProduct((prev) => ({
                        ...prev,
                        size: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700">
                    Giá bán
                  </label>
                  <input
                    type="number"
                    step="1000"
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={editingProduct.giaBan}
                    onChange={(e) =>
                      setEditingProduct((prev) => ({
                        ...prev,
                        giaBan: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">
                  Mô tả
                </label>
                <textarea
                  rows={2}
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={editingProduct.mota}
                  onChange={(e) =>
                    setEditingProduct((prev) => ({
                      ...prev,
                      mota: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">
                  Ảnh sản phẩm
                </label>
                <input
                  type="file"
                  accept="image/*"
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 cursor-pointer"
                  onChange={(e) =>
                    setEditingProduct((prev) => ({
                      ...prev,
                      hinhAnhUpload: e.target.files?.[0] || null,
                    }))
                  }
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-green-500 text-sm font-bold text-white hover:bg-green-600 disabled:opacity-60 shadow-sm transition"
                >
                  Cập nhật
                </button>
                <button
                  type="button"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-gray-300 text-sm font-bold text-gray-700 hover:bg-gray-400 shadow-sm"
                  onClick={() => setEditingProduct(null)}
                >
                  Hủy
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <h3 className="text-lg font-bold text-gray-800">
              Thêm sản phẩm mới
            </h3>
            <form className="space-y-3 text-sm" onSubmit={handleCreateProduct}>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">
                  Tên sản phẩm
                </label>
                <input
                  type="text"
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={newProduct.SanPhamName}
                  onChange={(e) =>
                    setNewProduct((prev) => ({
                      ...prev,
                      SanPhamName: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700">
                    Thể loại
                  </label>
                  <select
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={newProduct.TheLoaiId}
                    onChange={(e) =>
                      setNewProduct((prev) => ({
                        ...prev,
                        TheLoaiId: e.target.value,
                      }))
                    }
                  >
                    <option value="">Chọn thể loại</option>
                    {categories.map((cat) => (
                      <option
                        key={cat.theLoaiId || cat.id}
                        value={cat.theLoaiId || cat.id}
                      >
                        {cat.theLoaiName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700">
                    Nguyên liệu
                  </label>
                  <select
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={newProduct.NguyenLieuId}
                    onChange={(e) =>
                      setNewProduct((prev) => ({
                        ...prev,
                        NguyenLieuId: e.target.value,
                      }))
                    }
                  >
                    <option value="">Không chọn</option>
                    {ingredients.map((ing) => (
                      <option
                        key={ing.nguyenLieuId || ing.id}
                        value={ing.nguyenLieuId || ing.id}
                      >
                        {ing.nguyenLieuName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700">
                    Size
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={newProduct.Size}
                    onChange={(e) =>
                      setNewProduct((prev) => ({
                        ...prev,
                        Size: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700">
                    Giá bán
                  </label>
                  <input
                    type="number"
                    step="1000"
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={newProduct.GiaBan}
                    onChange={(e) =>
                      setNewProduct((prev) => ({
                        ...prev,
                        GiaBan: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">
                  Mô tả
                </label>
                <textarea
                  rows={2}
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={newProduct.MoTa}
                  onChange={(e) =>
                    setNewProduct((prev) => ({ ...prev, MoTa: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">
                  Ảnh sản phẩm
                </label>
                <input
                  type="file"
                  accept="image/*"
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 cursor-pointer"
                  onChange={(e) =>
                    setNewProduct((prev) => ({
                      ...prev,
                      HinhAnhUpload: e.target.files?.[0] || null,
                    }))
                  }
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2.5 rounded-xl bg-green-500 text-sm font-bold text-white hover:bg-green-600 disabled:opacity-60 shadow-sm transition"
              >
                Lưu sản phẩm
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );

  const renderDiscounts = () => (
    <div className="space-y-4">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between bg-white p-4 rounded-2xl shadow-sm border border-green-100">
        <div>
          <h2 className="text-xl font-bold text-gray-800">
            Quản lý mã giảm giá
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Tìm kiếm, tạo mới, chỉnh sửa và xóa các mã giảm giá.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
          <input
            type="text"
            placeholder="Tìm theo mã..."
            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 sm:min-w-[200px]"
            value={searchDiscountKey}
            onChange={(e) => {
              setSearchDiscountKey(e.target.value);
              handleSearchDiscount(e.target.value);
            }}
          />
          <button
            type="button"
            onClick={() => {
              setSearchDiscountKey("");
              handleSearchDiscount("");
            }}
            className="px-4 py-2 rounded-xl bg-gray-100 text-sm font-bold text-gray-600 shadow-sm hover:bg-gray-200 transition"
          >
            Tải lại
          </button>
        </div>
      </header>

      <div className="rounded-2xl bg-white border border-green-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto text-sm">
          <table className="min-w-full text-left">
            <thead className="text-xs uppercase font-bold text-green-700 bg-green-50 border-b border-green-100">
              <tr>
                <th className="py-3 px-4">Mã</th>
                <th className="py-3 px-4">Loại</th>
                <th className="py-3 px-4">Giá trị</th>
                <th className="py-3 px-4">Số lượng</th>
                <th className="py-3 px-4">Ngày bắt đầu</th>
                <th className="py-3 px-4">Ngày kết thúc</th>
                <th className="py-3 px-4">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {discounts.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50 transition">
                  <td className="py-3 px-4 text-gray-800 font-bold">
                    {d.code}
                  </td>
                  <td className="py-3 px-4 text-gray-600">{d.loaiMa}</td>
                  <td className="py-3 px-4 text-green-600 font-bold">
                    {d.maxValue?.toLocaleString("vi-VN")}
                  </td>
                  <td className="py-3 px-4 text-gray-600">{d.soLuong}</td>
                  <td className="py-3 px-4 text-gray-600">
                    {d.ngayBatDau?.slice(0, 10)}
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {d.ngayKetThuc?.slice(0, 10)}
                  </td>
                  <td className="py-3 px-4 flex gap-2">
                    <button
                      onClick={() => handleEditDiscount(d)}
                      className="text-blue-500 hover:text-blue-700 font-semibold bg-blue-50 px-3 py-1 rounded-lg"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDeleteDiscount(d.id)}
                      className="text-red-500 hover:text-red-700 font-semibold bg-red-50 px-3 py-1 rounded-lg"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
              {discounts.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="py-4 text-center text-gray-500 text-sm"
                  >
                    Chưa có mã giảm giá nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <section className="rounded-2xl bg-white border border-green-100 p-6 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-gray-800">
          {editingDiscount ? "Chỉnh sửa mã giảm giá" : "Tạo mã giảm giá mới"}
        </h3>
        <form
          className="space-y-4 text-sm"
          onSubmit={
            editingDiscount ? handleUpdateDiscount : handleCreateDiscount
          }
        >
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700">
              Mã giảm giá
            </label>
            <input
              type="text"
              required
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
              value={editingDiscount ? editingDiscount.code : newDiscount.Code}
              onChange={(e) => {
                if (editingDiscount) {
                  setEditingDiscount((prev) => ({
                    ...prev,
                    code: e.target.value,
                  }));
                } else {
                  setNewDiscount((prev) => ({
                    ...prev,
                    Code: e.target.value,
                  }));
                }
              }}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700">
                Loại mã
              </label>
              <select
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
                value={
                  editingDiscount ? editingDiscount.loaiMa : newDiscount.LoaiMa
                }
                onChange={(e) => {
                  if (editingDiscount) {
                    setEditingDiscount((prev) => ({
                      ...prev,
                      loaiMa: e.target.value,
                    }));
                  } else {
                    setNewDiscount((prev) => ({
                      ...prev,
                      LoaiMa: e.target.value,
                    }));
                  }
                }}
              >
                <option value="Persent">Phần trăm</option>
                <option value="Fixed">Cố định</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700">
                Giá trị tối đa
              </label>
              <input
                type="number"
                step="1000"
                required
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
                value={
                  editingDiscount
                    ? editingDiscount.maxValue
                    : newDiscount.MaxValue
                }
                onChange={(e) => {
                  if (editingDiscount) {
                    setEditingDiscount((prev) => ({
                      ...prev,
                      maxValue: parseFloat(e.target.value) || 0,
                    }));
                  } else {
                    setNewDiscount((prev) => ({
                      ...prev,
                      MaxValue: e.target.value,
                    }));
                  }
                }}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700">
              Số lượng
            </label>
            <input
              type="number"
              required
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
              value={
                editingDiscount ? editingDiscount.soLuong : newDiscount.SoLuong
              }
              onChange={(e) => {
                if (editingDiscount) {
                  setEditingDiscount((prev) => ({
                    ...prev,
                    soLuong: parseInt(e.target.value) || 0,
                  }));
                } else {
                  setNewDiscount((prev) => ({
                    ...prev,
                    SoLuong: e.target.value,
                  }));
                }
              }}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700">
                Ngày bắt đầu
              </label>
              <input
                type="date"
                required
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
                value={
                  editingDiscount
                    ? editingDiscount.ngayBatDau
                    : newDiscount.NgayBatDau
                }
                onChange={(e) => {
                  if (editingDiscount) {
                    setEditingDiscount((prev) => ({
                      ...prev,
                      ngayBatDau: e.target.value,
                    }));
                  } else {
                    setNewDiscount((prev) => ({
                      ...prev,
                      NgayBatDau: e.target.value,
                    }));
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700">
                Ngày kết thúc
              </label>
              <input
                type="date"
                required
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
                value={
                  editingDiscount
                    ? editingDiscount.ngayKetThuc
                    : newDiscount.NgayKetThuc
                }
                onChange={(e) => {
                  if (editingDiscount) {
                    setEditingDiscount((prev) => ({
                      ...prev,
                      ngayKetThuc: e.target.value,
                    }));
                  } else {
                    setNewDiscount((prev) => ({
                      ...prev,
                      NgayKetThuc: e.target.value,
                    }));
                  }
                }}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 rounded-xl bg-green-500 text-sm font-bold text-white hover:bg-green-600 disabled:opacity-60 shadow-sm transition"
            >
              {editingDiscount ? "Cập nhật" : "Lưu mã giảm giá"}
            </button>
            {editingDiscount && (
              <button
                type="button"
                onClick={() => setEditingDiscount(null)}
                className="flex-1 px-4 py-3 rounded-xl bg-gray-300 text-sm font-bold text-gray-700 hover:bg-gray-400 shadow-sm transition"
              >
                Hủy
              </button>
            )}
          </div>
        </form>
      </section>
    </div>
  );

  const renderPartners = () => (
    <div className="space-y-4">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between bg-white p-4 rounded-2xl shadow-sm border border-green-100">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Quản lý đối tác</h2>
          <p className="text-sm text-gray-500 mt-1">
            Tìm kiếm, tạo mới, chỉnh sửa và xóa các đối tác cung cấp.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
          <input
            type="text"
            placeholder="Tìm theo tên..."
            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 sm:min-w-[200px]"
            value={searchPartnerKey}
            onChange={(e) => {
              setSearchPartnerKey(e.target.value);
              handleSearchPartner(e.target.value);
            }}
          />
          <button
            type="button"
            onClick={() => {
              setSearchPartnerKey("");
              handleSearchPartner("");
            }}
            className="px-4 py-2 rounded-xl bg-gray-100 text-sm font-bold text-gray-600 shadow-sm hover:bg-gray-200 transition"
          >
            Tải lại
          </button>
        </div>
      </header>
      <div className="rounded-2xl bg-white border border-green-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto text-sm">
          <table className="min-w-full text-left">
            <thead className="text-xs uppercase font-bold text-green-700 bg-green-50 border-b border-green-100">
              <tr>
                <th className="py-3 px-4">Tên</th>
                <th className="py-3 px-4">SĐT</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Địa chỉ</th>
                <th className="py-3 px-4">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {partners.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition">
                  <td className="py-3 px-4 text-gray-800 font-bold">
                    {p.name}
                  </td>
                  <td className="py-3 px-4 text-gray-600">{p.phone}</td>
                  <td className="py-3 px-4 text-gray-600">{p.email}</td>
                  <td className="py-3 px-4 text-gray-600">{p.address}</td>
                  <td className="py-3 px-4 flex gap-2">
                    <button
                      onClick={() => handleEditPartner(p)}
                      className="text-blue-500 hover:text-blue-700 font-semibold bg-blue-50 px-3 py-1 rounded-lg"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDeletePartner(p.id)}
                      className="text-red-500 hover:text-red-700 font-semibold bg-red-50 px-3 py-1 rounded-lg"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
              {partners.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="py-4 text-center text-gray-500 text-sm"
                  >
                    Chưa có đối tác nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <section className="rounded-2xl bg-white border border-green-100 p-6 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-gray-800">
          {editingPartner ? "Chỉnh sửa đối tác" : "Thêm đối tác mới"}
        </h3>
        <form
          className="space-y-4 text-sm"
          onSubmit={editingPartner ? handleUpdatePartner : handleCreatePartner}
        >
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700">
              Tên đối tác
            </label>
            <input
              type="text"
              required
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
              value={editingPartner ? editingPartner.name : newPartner.name}
              onChange={(e) => {
                if (editingPartner) {
                  setEditingPartner((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }));
                } else {
                  setNewPartner((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }));
                }
              }}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700">
              Số điện thoại
            </label>
            <input
              type="tel"
              required
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
              value={editingPartner ? editingPartner.phone : newPartner.phone}
              onChange={(e) => {
                if (editingPartner) {
                  setEditingPartner((prev) => ({
                    ...prev,
                    phone: e.target.value,
                  }));
                } else {
                  setNewPartner((prev) => ({
                    ...prev,
                    phone: e.target.value,
                  }));
                }
              }}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700">
              Email
            </label>
            <input
              type="email"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
              value={editingPartner ? editingPartner.email : newPartner.email}
              onChange={(e) => {
                if (editingPartner) {
                  setEditingPartner((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }));
                } else {
                  setNewPartner((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }));
                }
              }}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700">
              Địa chỉ
            </label>
            <input
              type="text"
              required
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
              value={
                editingPartner ? editingPartner.address : newPartner.address
              }
              onChange={(e) => {
                if (editingPartner) {
                  setEditingPartner((prev) => ({
                    ...prev,
                    address: e.target.value,
                  }));
                } else {
                  setNewPartner((prev) => ({
                    ...prev,
                    address: e.target.value,
                  }));
                }
              }}
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 rounded-xl bg-green-500 text-sm font-bold text-white hover:bg-green-600 disabled:opacity-60 shadow-sm transition"
            >
              {editingPartner ? "Cập nhật" : "Thêm đối tác"}
            </button>
            {editingPartner && (
              <button
                type="button"
                onClick={() => setEditingPartner(null)}
                className="flex-1 px-4 py-3 rounded-xl bg-gray-300 text-sm font-bold text-gray-700 hover:bg-gray-400 shadow-sm transition"
              >
                Hủy
              </button>
            )}
          </div>
        </form>
      </section>
    </div>
  );

  const renderKho = () => (
    <div className="space-y-4 max-w-5xl">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-green-100">
        <div>
          <h2 className="text-xl font-bold text-gray-800">
            Quản lý kho nguyên liệu
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Nhập mã Shop ID..."
            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 w-40"
            value={khoShopId}
            onChange={(e) => setKhoShopId(e.target.value)}
          />
          <button
            type="button"
            disabled={loading || !khoShopId}
            onClick={handleLoadKho}
            className="px-4 py-2.5 rounded-xl bg-yellow-400 text-sm font-bold text-yellow-900 shadow-sm hover:bg-yellow-500 disabled:opacity-60 transition"
          >
            Tải tồn kho
          </button>
        </div>
      </header>
      <div className="rounded-2xl bg-white border border-green-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto text-sm">
          <table className="min-w-full text-left">
            <thead className="text-xs uppercase font-bold text-green-700 bg-green-50 border-b border-green-100">
              <tr>
                <th className="py-3 px-4">Nguyên liệu</th>
                <th className="py-3 px-4">Đơn vị</th>
                <th className="py-3 px-4">Tồn kho</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {inventory.map((i) => (
                <tr
                  key={i.tonKhoId || `${i.shopId}-${i.nguyenLieuId}`}
                  className="hover:bg-gray-50 transition"
                >
                  <td className="py-3 px-4 text-gray-800 font-semibold">
                    {i.nguyenLieu?.nguyenLieuName}
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {i.nguyenLieu?.donVi}
                  </td>
                  <td className="py-3 px-4 text-yellow-600 font-bold">
                    {i.soLuong}
                  </td>
                </tr>
              ))}
              {inventory.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    className="py-6 text-center text-gray-500 text-sm"
                  >
                    Chưa có dữ liệu tồn kho. Vui lòng nhập mã cửa hàng và nhấn
                    tải.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="space-y-4">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between bg-white p-4 rounded-2xl shadow-sm border border-green-100">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Báo cáo doanh thu</h2>
          <p className="text-sm text-gray-500 mt-1">
            Biểu đồ và thống kê doanh thu theo cửa hàng.
          </p>
        </div>
      </header>
      <div className="rounded-2xl bg-white border border-green-100 p-6 shadow-sm text-center">
        <p className="text-gray-500">
          Tính năng báo cáo đang được phát triển...
        </p>
      </div>
    </div>
  );

  const renderInvoices = () => (
    <div className="space-y-4">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between bg-white p-4 rounded-2xl shadow-sm border border-green-100">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Quản lý hóa đơn</h2>
          <p className="text-sm text-gray-500 mt-1">
            Dữ liệu mua bán và hóa đơn của từng cửa hàng.
          </p>
        </div>
      </header>
      <div className="rounded-2xl bg-white border border-green-100 p-6 shadow-sm text-center">
        <p className="text-gray-500">
          Tính năng hóa đơn đang được phát triển...
        </p>
      </div>
    </div>
  );

  const renderAttendance = () => (
    <div className="space-y-4">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between bg-white p-4 rounded-2xl shadow-sm border border-green-100">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Dữ liệu chấm công</h2>
          <p className="text-sm text-gray-500 mt-1">
            Lịch làm việc và dữ liệu chấm công cá nhân.
          </p>
        </div>
      </header>
      <div className="rounded-2xl bg-white border border-green-100 p-6 shadow-sm text-center">
        <p className="text-gray-500">
          Tính năng chấm công đang được phát triển...
        </p>
      </div>
    </div>
  );

  const renderPayroll = () => (
    <div className="space-y-4">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between bg-white p-4 rounded-2xl shadow-sm border border-green-100">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Quản lý lương</h2>
          <p className="text-sm text-gray-500 mt-1">
            Công thức tính lương và bảng lương các tháng.
          </p>
        </div>
      </header>
      <div className="rounded-2xl bg-white border border-green-100 p-6 shadow-sm text-center">
        <p className="text-gray-500">Tính năng lương đang được phát triển...</p>
      </div>
    </div>
  );

  const activeGroupObj =
    availableGroups.find((g) => g.id === activeGroup) || availableGroups[0];
  const subTabs = activeGroupObj?.subTabs || [];

  // Keep activeTab in sync with the selected group
  useEffect(() => {
    if (!subTabs.some((t) => t.id === activeTab)) {
      setActiveTab(subTabs[0]?.id || "overview");
    }
  }, [activeGroup, subTabs]);

  let content = null;
  if (activeTab === "overview") content = renderOverview();
  if (activeTab === "employees") content = renderEmployees();
  if (activeTab === "roles") content = renderRoles();
  if (activeTab === "shops") content = renderShops();
  if (activeTab === "products") content = renderProducts();
  if (activeTab === "discounts") content = renderDiscounts();
  if (activeTab === "reports") content = renderReports();
  if (activeTab === "invoices") content = renderInvoices();
  if (activeTab === "partners") content = renderPartners();
  if (activeTab === "kho") content = renderKho();
  if (activeTab === "attendance") content = renderAttendance();
  if (activeTab === "payroll") content = renderPayroll();

  return (
    <div className="space-y-6 font-sans text-gray-800">
      {/* HEADER CỦA DASHBOARD - GỌN GÀNG HƠN DO ĐÃ CHUYỂN PROFILE SANG LAYOUT */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-green-100">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800">
            Dashboard <span className="text-green-500">Quản Trị</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1 max-w-lg">
            Trung tâm điều khiển toàn bộ chức năng nội bộ (nhân viên, cửa hàng,
            sản phẩm, khuyến mãi, kho, đối tác...).
          </p>
        </div>
        {loading && (
          <span className="text-sm text-green-500 font-bold animate-pulse px-4 py-2 bg-green-50 rounded-lg">
            Đang tải dữ liệu...
          </span>
        )}
      </div>

      {/* Main role tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {availableGroups.map((group) => (
          <button
            key={group.id}
            type="button"
            onClick={() => setGroupAndTab(group.id)}
            className={`whitespace-nowrap px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all ${
              activeGroup === group.id
                ? "bg-green-500 text-white transform -translate-y-0.5"
                : "bg-white text-gray-600 border border-green-100 hover:bg-green-50"
            }`}
          >
            {group.label}
          </button>
        ))}
      </div>

      {/* Sub-tabs for selected module group */}
      {subTabs.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {subTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-semibold shadow-sm transition-all ${
                activeTab === tab.id
                  ? "bg-green-500 text-white"
                  : "bg-white text-gray-600 border border-green-100 hover:bg-green-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 font-bold flex items-center gap-2 shadow-sm">
          <span>⚠️</span> {error}
        </div>
      )}

      {content}
    </div>
  );
};

export default DashboardPage;
