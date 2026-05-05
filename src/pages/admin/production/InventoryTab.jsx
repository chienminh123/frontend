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

const InventoryTab = () => {
  // --- STATES TRA CỨU TỒN KHO ---
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [khoShopId, setKhoShopId] = useState("");

  // --- STATES MASTER DATA ---
  const [shops, setShops] = useState([]);
  const [partners, setPartners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [materials, setMaterials] = useState([]);

  // --- STATES MODALS ---
  const [activeModal, setActiveModal] = useState(null);

  // States form Nhập/Xuất
  const [formData, setFormData] = useState({
    hanhDong: "",
    shopId: "",
    doiTacId: "",
  });
  const [formItems, setFormItems] = useState([]);

  // States form Kiểm kê
  const [auditShopId, setAuditShopId] = useState("");
  const [auditItems, setAuditItems] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  const authHeaders = useMemo(
    () => ({ Authorization: `Bearer ${getAdminToken()}` }),
    [],
  );

  // --- 1. TẢI DỮ LIỆU GỐC ---
  useEffect(() => {
    const loadMasterData = async () => {
      try {
        const [resShop, resPartner, resCat, resMat] = await Promise.all([
          api.get("/admin/ShopInfo", { headers: authHeaders }),
          api.get("/DoiTac", { headers: authHeaders }),
          api.get("/admin/Genre", { headers: authHeaders }),
          api.get("/Admin/Kho", { headers: authHeaders }),
        ]);

        setShops(
          Array.isArray(resShop.data) ? resShop.data : resShop.data?.data || [],
        );
        setPartners(
          Array.isArray(resPartner.data)
            ? resPartner.data
            : resPartner.data?.data || [],
        );
        setCategories(
          Array.isArray(resCat.data) ? resCat.data : resCat.data?.data || [],
        );
        setMaterials(
          Array.isArray(resMat.data) ? resMat.data : resMat.data?.data || [],
        );
      } catch (err) {
        console.error("Lỗi tải dữ liệu danh mục:", err);
      }
    };
    loadMasterData();
  }, [authHeaders]);

  // --- 2. TRA CỨU TỒN KHO ---
  const handleLoadKho = async () => {
    if (!khoShopId) return;
    try {
      setLoading(true);
      const res = await api.get(`/Admin/Kho/get_by_shop/${khoShopId}`, {
        headers: authHeaders,
      });
      setInventory(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      alert("Lỗi tải dữ liệu kho. Vui lòng kiểm tra lại mã cửa hàng.");
    } finally {
      setLoading(false);
    }
  };

  // --- 3. XỬ LÝ FORM NHẬP / XUAT ---
  const openModal = (type) => {
    setActiveModal(type);
    setFormData({
      hanhDong: type === "NHAP" ? "NHAP_NCC" : "XUAT_HUY",
      shopId: "",
      doiTacId: "",
    });
    setFormItems([]);
    setAuditShopId("");
    setAuditItems([]);
  };

  const addItemRow = () => {
    setFormItems([
      ...formItems,
      {
        NguyenLieuName: "",
        DonVi: "",
        GiaNhap: 0,
        TheLoaiId: "",
        SoLuong: 1,
        NgaySanXuat: "", // Thêm NSX
        HanSuDung: "", // Thêm HSD
        GhiChu: "",
      },
    ]);
  };

  const updateItemRow = (index, field, value) => {
    const newItems = [...formItems];
    newItems[index][field] = value;

    if (field === "NguyenLieuName") {
      const existMat = materials.find((m) => m.nguyenLieuName === value);
      if (existMat) {
        newItems[index].DonVi = existMat.donVi || "";
        newItems[index].GiaNhap = existMat.giaNhap || 0;
        newItems[index].TheLoaiId = existMat.theLoaiId || "";
      }
    }
    setFormItems(newItems);
  };

  const removeItemRow = (index) => {
    setFormItems(formItems.filter((_, i) => i !== index));
  };

  const submitNhapXuat = async (e) => {
    e.preventDefault();
    if (!formData.shopId || formItems.length === 0)
      return alert("Vui lòng chọn cửa hàng và thêm ít nhất 1 mặt hàng!");

    try {
      setLoading(true);
      const endpoint =
        activeModal === "NHAP" ? "/Admin/Kho/nhap_kho" : "/Admin/Kho/xuat_kho";

      const payload = {
        HanhDong: formData.hanhDong,
        KhoNhapId: parseInt(formData.shopId),
        KhoXuatId: parseInt(formData.shopId),
        DoiTacId: formData.doiTacId ? parseInt(formData.doiTacId) : null,
        Items: formItems.map((i) => ({
          NguyenLieuName: i.NguyenLieuName,
          DonVi: i.DonVi,
          GhiChu: i.GhiChu,
          GiaNhap: parseFloat(i.GiaNhap) || 0,
          SoLuong: parseFloat(i.SoLuong) || 0,
          TheLoaiId: i.TheLoaiId ? parseInt(i.TheLoaiId) : 0,
          // Convert ngày sang ISO Format cho C# hiểu
          NgaySanXuat: i.NgaySanXuat
            ? new Date(i.NgaySanXuat).toISOString()
            : null,
          HanSuDung: i.HanSuDung ? new Date(i.HanSuDung).toISOString() : null,
        })),
      };

      await api.post(endpoint, payload, { headers: authHeaders });
      alert(`${activeModal === "NHAP" ? "Nhập" : "Xuất"} kho thành công!`);
      setActiveModal(null);
      if (khoShopId === formData.shopId) handleLoadKho();
    } catch (err) {
      alert("Lỗi xử lý: " + (err.response?.data || err.message));
    } finally {
      setLoading(false);
    }
  };

  // --- 4. XỬ LÝ KIỂM KÊ ---
  const loadKiemKeData = async () => {
    if (!auditShopId) return;
    try {
      setLoadingAudit(true);
      const res = await api.get(`/Admin/Kho/get_by_shop/${auditShopId}`, {
        headers: authHeaders,
      });
      const currentInv = Array.isArray(res.data) ? res.data : [];
      setAuditItems(
        currentInv.map((i) => ({
          NguyenLieuId: i.nguyenLieuId,
          TenNguyenLieu: i.nguyenLieu?.nguyenLieuName,
          DonVi: i.nguyenLieu?.donVi,
          TonHeThong: parseFloat(i.soLuong) || 0,
          TonThucTe: parseFloat(i.soLuong) || 0,
          Note: "",
        })),
      );
    } catch (err) {
      alert("Lỗi tải dữ liệu kiểm kê");
    } finally {
      setLoadingAudit(false);
    }
  };

  const addAuditItemRow = () => {
    setAuditItems([
      ...auditItems,
      {
        NguyenLieuId: "",
        TenNguyenLieu: "",
        DonVi: "",
        TonHeThong: 0,
        TonThucTe: 0,
        Note: "Hàng phát sinh",
      },
    ]);
  };

  const submitKiemKe = async (e) => {
    e.preventDefault();
    if (!auditShopId || auditItems.length === 0)
      return alert("Vui lòng chọn cửa hàng và lấy dữ liệu tồn kho!");

    try {
      setLoading(true);
      const payload = {
        ShopId: parseInt(auditShopId),
        ChiTiet: auditItems.map((i) => {
          const tonTT = parseFloat(i.TonThucTe) || 0;
          const tonHT = parseFloat(i.TonHeThong) || 0;
          return {
            NguyenLieuId: parseInt(i.NguyenLieuId),
            TonHeThong: tonHT,
            TonThucTe: tonTT,
            ChenhLech: tonTT - tonHT, // Đẩy thẳng Chênh lệch xuống C#
            Note: i.Note || "",
          };
        }),
      };

      await api.post("/Admin/Kho/kiem_ke", payload, { headers: authHeaders });
      alert("Chốt kiểm kê thành công!");
      setActiveModal(null);
      if (khoShopId === auditShopId) handleLoadKho();
    } catch (err) {
      alert("Lỗi kiểm kê: " + (err.response?.data || err.message));
    } finally {
      setLoading(false);
    }
  };

  // =====================================
  // RENDER UI
  // =====================================
  return (
    <div className="space-y-6 max-w-7xl animate-fade-in relative">
      {/* THANH CÔNG CỤ TRÊN CÙNG */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-green-100">
        <div>
          <h2 className="text-xl font-bold text-gray-800">
            Quản lý kho nguyên liệu
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Điều phối nhập/xuất và kiểm kê định kỳ.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => openModal("NHAP")}
            className="px-5 py-2.5 rounded-xl bg-blue-500 text-sm font-bold text-white shadow-sm hover:bg-blue-600 transition"
          >
            📥 Nhập Kho
          </button>
          <button
            onClick={() => openModal("XUAT")}
            className="px-5 py-2.5 rounded-xl bg-orange-500 text-sm font-bold text-white shadow-sm hover:bg-orange-600 transition"
          >
            📤 Xuất Kho
          </button>
          <button
            onClick={() => openModal("KIEMKE")}
            className="px-5 py-2.5 rounded-xl bg-purple-500 text-sm font-bold text-white shadow-sm hover:bg-purple-600 transition"
          >
            📋 Kiểm Kê
          </button>
        </div>
      </div>

      {/* TÍNH NĂNG TRA CỨU */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-green-100 flex flex-col sm:flex-row items-center gap-4">
        <span className="font-bold text-gray-700">Tra cứu tồn kho tại:</span>
        <select
          className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-green-500 w-64"
          value={khoShopId}
          onChange={(e) => setKhoShopId(e.target.value)}
        >
          <option value="">-- Chọn cửa hàng --</option>
          {shops.map((s) => (
            <option
              key={s.cuaHangId || s.shopId || s.id}
              value={s.cuaHangId || s.shopId || s.id}
            >
              {s.shopName}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={loading || !khoShopId}
          onClick={handleLoadKho}
          className="px-6 py-2 rounded-xl bg-green-500 text-sm font-bold text-white shadow-sm hover:bg-green-600 disabled:opacity-60 transition"
        >
          {loading ? "Đang tải..." : "Xem dữ liệu"}
        </button>
      </div>

      {/* BẢNG TỒN KHO */}
      <div className="rounded-2xl bg-white border border-green-100 overflow-hidden shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="text-xs uppercase font-bold text-green-700 bg-green-50 border-b border-green-100">
            <tr>
              <th className="py-3 px-6">Tên nguyên liệu</th>
              <th className="py-3 px-6">Đơn vị tính</th>
              <th className="py-3 px-6 text-right">Số lượng tồn kho</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {inventory.map((i) => (
              <tr
                key={i.tonKhoId || `${i.shopId}-${i.nguyenLieuId}`}
                className="hover:bg-gray-50 transition"
              >
                <td className="py-4 px-6 text-gray-800 font-bold">
                  {i.nguyenLieu?.nguyenLieuName}
                </td>
                <td className="py-4 px-6 text-gray-600 font-medium">
                  {i.nguyenLieu?.donVi}
                </td>
                <td className="py-4 px-6 text-yellow-600 font-black text-lg text-right">
                  {i.soLuong?.toLocaleString()}
                </td>
              </tr>
            ))}
            {inventory.length === 0 && (
              <tr>
                <td colSpan={3} className="py-8 text-center text-gray-500">
                  Chưa có dữ liệu tồn kho. Vui lòng chọn cửa hàng và nhấn xem dữ
                  liệu.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ============================================================== */}
      {/* MODAL: NHẬP / XUẤT KHO */}
      {/* ============================================================== */}
      {(activeModal === "NHAP" || activeModal === "XUAT") && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-6xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center z-10">
              <h3 className="text-xl font-bold text-gray-800">
                {activeModal === "NHAP"
                  ? "📥 Lập Phiếu Nhập Kho"
                  : "📤 Lập Phiếu Xuất Kho"}
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="text-gray-400 hover:text-red-500 font-bold text-xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={submitNhapXuat} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-600 uppercase">
                    Hành động
                  </label>
                  <select
                    required
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-green-500"
                    value={formData.hanhDong}
                    onChange={(e) =>
                      setFormData({ ...formData, hanhDong: e.target.value })
                    }
                  >
                    {activeModal === "NHAP" ? (
                      <>
                        <option value="NHAP_NCC">Nhập từ Nhà Cung Cấp</option>
                        <option value="NHAP_DIEU_CHUYEN_NOI_BO">
                          Nhập Điều Chuyển
                        </option>
                      </>
                    ) : (
                      <>
                        <option value="XUAT_HUY">Xuất Hủy</option>
                        <option value="XUAT_TRA_NCC">
                          Xuất Trả Nhà Cung Cấp
                        </option>
                        <option value="XUAT_DIEU_CHUYEN_NOI_BO">
                          Xuất Điều Chuyển
                        </option>
                      </>
                    )}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-600 uppercase">
                    Tại Cửa Hàng
                  </label>
                  <select
                    required
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-green-500"
                    value={formData.shopId}
                    onChange={(e) =>
                      setFormData({ ...formData, shopId: e.target.value })
                    }
                  >
                    <option value="">-- Chọn cửa hàng --</option>
                    {shops.map((s) => (
                      <option
                        key={s.cuaHangId || s.shopId || s.id}
                        value={s.cuaHangId || s.shopId || s.id}
                      >
                        {s.shopName}
                      </option>
                    ))}
                  </select>
                </div>
                {(formData.hanhDong === "NHAP_NCC" ||
                  formData.hanhDong === "XUAT_TRA_NCC") && (
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-gray-600 uppercase">
                      Nhà Cung Cấp
                    </label>
                    <select
                      required
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-green-500"
                      value={formData.doiTacId}
                      onChange={(e) =>
                        setFormData({ ...formData, doiTacId: e.target.value })
                      }
                    >
                      <option value="">-- Chọn đối tác --</option>
                      {partners.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-bold text-gray-800">
                    Danh sách mặt hàng
                  </h4>
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="px-4 py-1.5 bg-green-100 text-green-700 font-bold rounded-lg hover:bg-green-200 text-sm"
                  >
                    + Thêm dòng
                  </button>
                </div>

                <div className="overflow-x-auto border border-gray-200 rounded-xl">
                  <table className="min-w-full text-sm text-left">
                    <thead className="bg-gray-100 text-gray-600 text-xs uppercase font-bold">
                      <tr>
                        <th className="px-3 py-2 w-48">Tên Nguyên Liệu</th>
                        <th className="px-3 py-2 w-32">Thể Loại</th>
                        <th className="px-3 py-2 w-20">Đơn vị</th>
                        <th className="px-3 py-2 w-24">Số lượng</th>
                        <th className="px-3 py-2 w-28">Giá nhập</th>
                        <th className="px-3 py-2 w-36">Ngày SX</th>
                        <th className="px-3 py-2 w-36">Hạn SD</th>
                        <th className="px-3 py-2 w-32">Ghi chú</th>
                        <th className="px-2 py-2 w-10 text-center">Xóa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {formItems.map((item, idx) => (
                        <tr key={idx} className="bg-white">
                          <td className="p-2">
                            <input
                              list="material-list"
                              required
                              className="w-full border border-gray-300 rounded p-1.5 focus:ring-1 focus:ring-green-500"
                              placeholder="VD: Gạo ST25"
                              value={item.NguyenLieuName}
                              onChange={(e) =>
                                updateItemRow(
                                  idx,
                                  "NguyenLieuName",
                                  e.target.value,
                                )
                              }
                            />
                            <datalist id="material-list">
                              {materials.map((m) => (
                                <option
                                  key={m.nguyenLieuId}
                                  value={m.nguyenLieuName}
                                />
                              ))}
                            </datalist>
                          </td>
                          <td className="p-2">
                            <select
                              className="w-full border border-gray-300 rounded p-1.5 focus:ring-1 focus:ring-green-500"
                              value={item.TheLoaiId}
                              onChange={(e) =>
                                updateItemRow(idx, "TheLoaiId", e.target.value)
                              }
                            >
                              <option value="">-- Loại --</option>
                              {categories.map((c) => (
                                <option key={c.theLoaiId} value={c.theLoaiId}>
                                  {c.theLoaiName}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-2">
                            <input
                              required
                              className="w-full border border-gray-300 rounded p-1.5 focus:ring-1 focus:ring-green-500"
                              placeholder="kg..."
                              value={item.DonVi}
                              onChange={(e) =>
                                updateItemRow(idx, "DonVi", e.target.value)
                              }
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              step="0.1"
                              required
                              className="w-full border border-gray-300 rounded p-1.5 focus:ring-1 focus:ring-green-500 font-bold text-blue-600"
                              value={item.SoLuong}
                              onChange={(e) =>
                                updateItemRow(idx, "SoLuong", e.target.value)
                              }
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              step="1000"
                              className="w-full border border-gray-300 rounded p-1.5 focus:ring-1 focus:ring-green-500"
                              value={item.GiaNhap}
                              onChange={(e) =>
                                updateItemRow(idx, "GiaNhap", e.target.value)
                              }
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="date"
                              className="w-full border border-gray-300 rounded p-1.5 focus:ring-1 focus:ring-green-500"
                              value={item.NgaySanXuat}
                              onChange={(e) =>
                                updateItemRow(
                                  idx,
                                  "NgaySanXuat",
                                  e.target.value,
                                )
                              }
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="date"
                              className="w-full border border-gray-300 rounded p-1.5 focus:ring-1 focus:ring-green-500"
                              value={item.HanSuDung}
                              onChange={(e) =>
                                updateItemRow(idx, "HanSuDung", e.target.value)
                              }
                            />
                          </td>
                          <td className="p-2">
                            <input
                              className="w-full border border-gray-300 rounded p-1.5 focus:ring-1 focus:ring-green-500"
                              placeholder="Lý do..."
                              value={item.GhiChu}
                              onChange={(e) =>
                                updateItemRow(idx, "GhiChu", e.target.value)
                              }
                            />
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeItemRow(idx)}
                              className="text-red-500 hover:bg-red-100 p-1.5 rounded-lg font-bold"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-6 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-8 py-2.5 rounded-xl font-bold text-white shadow-md ${activeModal === "NHAP" ? "bg-blue-500 hover:bg-blue-600" : "bg-orange-500 hover:bg-orange-600"}`}
                >
                  {loading ? "Đang lưu..." : "Lưu Phiếu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: KIỂM KÊ KHO */}
      {/* ============================================================== */}
      {activeModal === "KIEMKE" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center z-10">
              <h3 className="text-xl font-bold text-gray-800">
                📋 Phiếu Kiểm Kê Kho
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="text-gray-400 hover:text-red-500 font-bold text-xl"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 bg-purple-50 p-4 rounded-2xl border border-purple-100">
                <div className="flex-1 space-y-1 w-full">
                  <label className="block text-xs font-bold text-purple-800 uppercase">
                    Chọn Cửa Hàng Để Kiểm Kê
                  </label>
                  <select
                    className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500"
                    value={auditShopId}
                    onChange={(e) => setAuditShopId(e.target.value)}
                  >
                    <option value="">-- Chọn cửa hàng --</option>
                    {shops.map((s) => (
                      <option
                        key={s.cuaHangId || s.shopId || s.id}
                        value={s.cuaHangId || s.shopId || s.id}
                      >
                        {s.shopName}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={loadKiemKeData}
                  disabled={!auditShopId || loadingAudit}
                  className="w-full sm:w-auto px-5 py-2 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 disabled:opacity-50"
                >
                  {loadingAudit ? "Đang tải..." : "Lấy số tồn HT"}
                </button>
              </div>

              <form onSubmit={submitKiemKe}>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-bold text-gray-800">
                    Cập nhật số lượng thực tế
                  </h4>
                  <button
                    type="button"
                    onClick={addAuditItemRow}
                    className="px-3 py-1.5 bg-gray-100 text-gray-600 font-bold rounded-lg hover:bg-gray-200 text-xs"
                  >
                    + Thêm hàng phát sinh
                  </button>
                </div>
                <div className="overflow-x-auto border border-gray-200 rounded-xl mb-6">
                  <table className="min-w-full text-sm text-left">
                    <thead className="bg-gray-100 text-gray-600 text-xs uppercase font-bold">
                      <tr>
                        <th className="px-4 py-3">Mặt hàng</th>
                        <th className="px-4 py-3">Đơn vị</th>
                        <th className="px-4 py-3 text-center">Tồn Hệ Thống</th>
                        <th className="px-4 py-3">Tồn Thực Tế (Sửa)</th>
                        <th className="px-4 py-3 text-center">Chênh lệch</th>
                        <th className="px-4 py-3">Lý do chênh lệch</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {auditItems.map((item, idx) => {
                        const tonTT = parseFloat(item.TonThucTe) || 0;
                        const tonHT = parseFloat(item.TonHeThong) || 0;
                        const diff = tonTT - tonHT;

                        return (
                          <tr key={idx} className="bg-white hover:bg-gray-50">
                            <td className="px-4 py-2 font-semibold">
                              {item.TenNguyenLieu ? (
                                item.TenNguyenLieu
                              ) : (
                                <select
                                  className="w-full border border-gray-300 rounded p-1"
                                  value={item.NguyenLieuId}
                                  onChange={(e) => {
                                    const newItems = [...auditItems];
                                    newItems[idx].NguyenLieuId = e.target.value;
                                    setAuditItems(newItems);
                                  }}
                                >
                                  <option value="">-- Chọn --</option>
                                  {materials.map((m) => (
                                    <option
                                      key={m.nguyenLieuId}
                                      value={m.nguyenLieuId}
                                    >
                                      {m.nguyenLieuName}
                                    </option>
                                  ))}
                                </select>
                              )}
                            </td>
                            <td className="px-4 py-2 text-gray-500">
                              {item.DonVi}
                            </td>
                            <td className="px-4 py-2 text-center text-gray-400 font-mono bg-gray-50">
                              {tonHT}
                            </td>
                            <td className="px-4 py-2">
                              <input
                                type="number"
                                step="0.1"
                                required
                                className="w-24 border border-purple-300 rounded p-1.5 focus:ring-2 focus:ring-purple-500 font-bold text-purple-700"
                                value={item.TonThucTe}
                                onChange={(e) => {
                                  const newItems = [...auditItems];
                                  newItems[idx].TonThucTe = e.target.value;
                                  setAuditItems(newItems);
                                }}
                              />
                            </td>
                            <td className="px-4 py-2 text-center font-bold">
                              {diff > 0 ? (
                                <span className="text-green-500">+{diff}</span>
                              ) : diff < 0 ? (
                                <span className="text-red-500">{diff}</span>
                              ) : (
                                <span className="text-gray-400">0</span>
                              )}
                            </td>
                            <td className="px-4 py-2">
                              <input
                                type="text"
                                className="w-full border border-gray-300 rounded p-1.5 focus:ring-1 focus:ring-purple-500"
                                placeholder="Vỡ, hỏng, sai số..."
                                value={item.Note}
                                onChange={(e) => {
                                  const newItems = [...auditItems];
                                  newItems[idx].Note = e.target.value;
                                  setAuditItems(newItems);
                                }}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="px-6 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={loading || auditItems.length === 0}
                    className="px-8 py-2.5 rounded-xl font-bold text-white shadow-md bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                  >
                    {loading ? "Đang xử lý..." : "Chốt Kiểm Kê"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryTab;
