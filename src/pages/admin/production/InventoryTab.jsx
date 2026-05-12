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
  // --- STATES TRẠNG THÁI HIỂN THỊ MAIN VIEW ---
  const [viewMode, setViewMode] = useState("TON_KHO"); // "TON_KHO" | "PHIEU_NHAP" | "PHIEU_XUAT" | "LICH_SU_KIEM_KE"

  // --- STATES TRA CỨU TỒN KHO ---
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [khoShopId, setKhoShopId] = useState("");

  // --- STATES QUẢN LÝ PHIẾU ---
  const [vouchers, setVouchers] = useState([]);
  const [voucherStatusTab, setVoucherStatusTab] = useState("CHO_XAC_NHAN");
  const [voucherActionFilter, setVoucherActionFilter] = useState("NHAP_NCC");

  // --- STATES MASTER DATA ---
  const [shops, setShops] = useState([]);
  const [partners, setPartners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [materials, setMaterials] = useState([]);

  // --- STATES MODALS CHÍNH ---
  const [activeModal, setActiveModal] = useState(null);

  // STATES CHO TÍNH NĂNG XEM CHI TIẾT PHIẾU
  const [detailModal, setDetailModal] = useState(null);
  const [detailItems, setDetailItems] = useState([]);

  // 🎯 STATES CHO LỊCH SỬ KIỂM KÊ (MỚI THÊM)
  const [auditHistory, setAuditHistory] = useState([]);
  const [detailAudit, setDetailAudit] = useState(null);

  // States form Nhập/Xuất
  const [formData, setFormData] = useState({
    hanhDong: "",
    shopId: "",
    khoNhapId: "",
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

  // --- 3. TRA CỨU DANH SÁCH PHIẾU ---
  const loadVouchers = async () => {
    if (!khoShopId || viewMode === "TON_KHO" || viewMode === "LICH_SU_KIEM_KE")
      return;
    try {
      setLoading(true);
      const res = await api.get(
        `/Admin/BienLai/danh_sach_phieu?hanhDong=${voucherActionFilter}&shopId=${khoShopId}`,
        { headers: authHeaders },
      );
      setVouchers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Lỗi tải danh sách phiếu:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === "PHIEU_NHAP" || viewMode === "PHIEU_XUAT") {
      if (khoShopId) loadVouchers();
    }
  }, [viewMode, voucherActionFilter, khoShopId]);

  // 🎯 HÀM LẤY LỊCH SỬ KIỂM KÊ VÀ XEM CHI TIẾT (MỚI THÊM)
  const loadAuditHistory = async () => {
    if (!khoShopId) return;
    try {
      setLoading(true);
      const res = await api.get(`/Admin/KiemKe/danh_sach/${khoShopId}`, {
        headers: authHeaders,
      });
      setAuditHistory(res.data);
    } catch (err) {
      alert("Lỗi tải danh sách kiểm kê.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === "LICH_SU_KIEM_KE" && khoShopId) {
      loadAuditHistory();
    }
  }, [viewMode, khoShopId]);

  const openAuditDetail = async (kiemKeId) => {
    try {
      setLoading(true);
      const res = await api.get(`/Admin/KiemKe/chi_tiet/${kiemKeId}`, {
        headers: authHeaders,
      });
      setDetailAudit(res.data);
      setActiveModal("XEM_CHI_TIET_KIEM_KE");
    } catch (err) {
      alert("Lỗi tải chi tiết kiểm kê");
    } finally {
      setLoading(false);
    }
  };

  const openVoucherDetail = async (voucher) => {
    try {
      setLoading(true);
      const res = await api.get(`/Admin/BienLai/chi_tiet_phieu/${voucher.id}`, {
        headers: authHeaders,
      });
      setDetailItems(Array.isArray(res.data) ? res.data : []);
      setDetailModal(voucher);
    } catch (err) {
      alert("Lỗi tải chi tiết phiếu");
    } finally {
      setLoading(false);
    }
  };

  // --- 5. XỬ LÝ DUYỆT / HỦY PHIẾU ---
  const getTransferShopName = (id) => {
    if (!id) return "Không rõ";
    const shop = shops.find(
      (s) => String(s.cuaHangId || s.shopId || s.id) === String(id),
    );
    return shop
      ? shop.shopName || shop.tenCuaHang || "Chưa có tên"
      : "Không rõ";
  };

  const handleProcessVoucher = async (id, status) => {
    if (
      !window.confirm(
        `Bạn có chắc muốn ${status === "HOAN_THANH" ? "DUYỆT" : "HỦY"} phiếu này? Kho sẽ được hệ thống cập nhật tự động.`,
      )
    )
      return;
    try {
      setLoading(true);
      await api.put(
        `/Admin/BienLai/xu_ly_phieu/${id}?trangThaiMoi=${status}`,
        null,
        { headers: authHeaders },
      );
      alert("Xử lý phiếu thành công!");
      setDetailModal(null);
      loadVouchers();
    } catch (err) {
      alert("Lỗi xử lý phiếu: " + (err.response?.data || err.message));
    } finally {
      setLoading(false);
    }
  };

  // --- CÁC HÀM XỬ LÝ FORM NHẬP XUẤT VÀ KIỂM KÊ ---
  const openModal = (type, overrides = {}) => {
    setActiveModal(type);
    setFormData({
      hanhDong:
        overrides.hanhDong || (type === "NHAP" ? "NHAP_NCC" : "XUAT_HUY"),
      shopId: overrides.shopId || "",
      khoNhapId: "",
      doiTacId: "",
    });
    setFormItems([]);
    setAuditShopId(overrides.shopId || "");
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
        NgaySanXuat: "",
        HanSuDung: "",
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
    if (formData.hanhDong === "XUAT_DIEU_CHUYEN_NOI_BO" && !formData.khoNhapId)
      return alert("Vui lòng chọn Cửa Hàng Nhận để điều chuyển đến!");

    try {
      setLoading(true);
      const endpoint =
        activeModal === "NHAP" ? "/Admin/Kho/nhap_kho" : "/Admin/Kho/xuat_kho";
      const payload = {
        HanhDong: formData.hanhDong,
        KhoNhapId:
          activeModal === "NHAP"
            ? parseInt(formData.shopId)
            : parseInt(formData.khoNhapId || 0),
        KhoXuatId: activeModal === "XUAT" ? parseInt(formData.shopId) : null,
        DoiTacId: formData.doiTacId ? parseInt(formData.doiTacId) : null,
        Items: formItems.map((i) => ({
          NguyenLieuName: i.NguyenLieuName,
          DonVi: i.DonVi,
          GhiChu: i.GhiChu,
          GiaNhap: parseFloat(i.GiaNhap) || 0,
          SoLuong: parseFloat(i.SoLuong) || 0,
          TheLoaiId: i.TheLoaiId ? parseInt(i.TheLoaiId) : 0,
          NgaySanXuat: i.NgaySanXuat
            ? new Date(i.NgaySanXuat).toISOString()
            : null,
          HanSuDung: i.HanSuDung ? new Date(i.HanSuDung).toISOString() : null,
        })),
      };

      await api.post(endpoint, payload, { headers: authHeaders });
      alert(
        `Đã tạo phiếu ${activeModal === "NHAP" ? "Nhập" : "Xuất"} thành công (Đang chờ duyệt)!`,
      );
      setActiveModal(null);
      if (
        viewMode !== "TON_KHO" &&
        viewMode !== "LICH_SU_KIEM_KE" &&
        khoShopId === formData.shopId &&
        voucherActionFilter === formData.hanhDong
      ) {
        loadVouchers();
      }
    } catch (err) {
      alert("Lỗi xử lý: " + (err.response?.data || err.message));
    } finally {
      setLoading(false);
    }
  };

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
      return alert("Vui lòng lấy dữ liệu tồn kho!");
    try {
      setLoading(true);
      const payload = {
        ShopId: parseInt(auditShopId),
        ChiTiet: auditItems.map((i) => ({
          NguyenLieuId: parseInt(i.NguyenLieuId),
          TonHeThong: parseFloat(i.TonHeThong) || 0,
          TonThucTe: parseFloat(i.TonThucTe) || 0,
          Note: i.Note || "",
        })),
      };
      await api.post("/Admin/Kho/kiem_ke", payload, { headers: authHeaders });
      alert("Chốt kiểm kê thành công!");
      setActiveModal(null);
      if (khoShopId === auditShopId && viewMode === "TON_KHO") handleLoadKho();
      if (khoShopId === auditShopId && viewMode === "LICH_SU_KIEM_KE")
        loadAuditHistory();
    } catch (err) {
      alert("Lỗi kiểm kê: " + (err.response?.data || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl animate-fade-in relative">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-green-100">
        <div>
          <h2 className="text-xl font-bold text-gray-800">
            Quản lý kho nguyên liệu
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setViewMode("TON_KHO")}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm ${viewMode === "TON_KHO" ? "bg-green-500 text-white" : "bg-gray-100 text-gray-700"}`}
          >
            📦 Tồn Kho
          </button>
          <button
            onClick={() => {
              setViewMode("PHIEU_NHAP");
              setVoucherActionFilter("NHAP_NCC");
              setVoucherStatusTab("CHO_XAC_NHAN");
            }}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm ${viewMode === "PHIEU_NHAP" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700"}`}
          >
            📥 Phiếu Nhập
          </button>
          <button
            onClick={() => {
              setViewMode("PHIEU_XUAT");
              setVoucherActionFilter("XUAT_HUY");
              setVoucherStatusTab("CHO_XAC_NHAN");
            }}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm ${viewMode === "PHIEU_XUAT" ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-700"}`}
          >
            📤 Phiếu Xuất
          </button>

          {/* 🎯 NÚT MỞ TAB LỊCH SỬ KIỂM KÊ (MỚI THÊM) */}
          <button
            onClick={() => {
              setViewMode("LICH_SU_KIEM_KE");
              if (khoShopId) loadAuditHistory();
            }}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm ${viewMode === "LICH_SU_KIEM_KE" ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-700"}`}
          >
            📋 Lịch sử Kiểm Kê
          </button>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-green-100 flex flex-col sm:flex-row items-center gap-4">
        <span className="font-bold text-gray-700">Tại chi nhánh:</span>
        <select
          className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-700 w-full sm:w-48"
          value={khoShopId}
          onChange={(e) => setKhoShopId(e.target.value)}
        >
          <option value="">-- Chọn cửa hàng --</option>
          {shops.map((s) => (
            <option
              key={s.cuaHangId || s.shopId || s.id}
              value={s.cuaHangId || s.shopId || s.id}
            >
              {s.shopName || s.tenCuaHang || "Chưa có tên"}
            </option>
          ))}
        </select>

        {viewMode === "PHIEU_NHAP" && (
          <select
            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-700 w-full sm:w-48"
            value={voucherActionFilter}
            onChange={(e) => {
              setVoucherActionFilter(e.target.value);
              setVoucherStatusTab("CHO_XAC_NHAN");
            }}
          >
            <option value="NHAP_NCC">Nhập từ Nhà CC</option>
            <option value="NHAP_DIEU_CHUYEN_NOI_BO">Nhập Điều Chuyển</option>
          </select>
        )}

        {viewMode === "PHIEU_XUAT" && (
          <select
            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-700 w-full sm:w-48"
            value={voucherActionFilter}
            onChange={(e) => {
              setVoucherActionFilter(e.target.value);
              setVoucherStatusTab("CHO_XAC_NHAN");
            }}
          >
            <option value="XUAT_HUY">Xuất Hủy</option>
            <option value="XUAT_TRA_NCC">Xuất Trả Nhà CC</option>
            <option value="XUAT_DIEU_CHUYEN_NOI_BO">Xuất Điều Chuyển</option>
          </select>
        )}

        {(viewMode === "TON_KHO" || viewMode === "LICH_SU_KIEM_KE") && (
          <>
            <button
              type="button"
              disabled={loading || !khoShopId}
              onClick={
                viewMode === "TON_KHO" ? handleLoadKho : loadAuditHistory
              }
              className={`px-6 py-2 rounded-xl text-white font-bold disabled:opacity-60 ${viewMode === "TON_KHO" ? "bg-green-500" : "bg-purple-600"}`}
            >
              {loading ? "Đang tải..." : "Xem dữ liệu"}
            </button>
            <button
              onClick={() => openModal("KIEMKE", { shopId: khoShopId })}
              disabled={!khoShopId}
              className="px-6 py-2 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-bold disabled:opacity-60 transition"
            >
              📋 Lập Phiếu Kiểm Kê Mới
            </button>
          </>
        )}
      </div>

      {/* ========================================================= */}
      {/* VÙNG CHỨA NỘI DUNG CHÍNH ĐƯỢC CHIA THÀNH 3 BLOCK ĐỘC LẬP */}
      {/* ========================================================= */}

      {/* BLOCK 1: TỒN KHO */}
      {viewMode === "TON_KHO" && (
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
                  className="hover:bg-gray-50"
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
                    Chưa có dữ liệu tồn kho.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* BLOCK 2: PHIẾU NHẬP / XUẤT */}
      {(viewMode === "PHIEU_NHAP" || viewMode === "PHIEU_XUAT") && (
        <div className="bg-white rounded-2xl shadow-sm border border-green-100 overflow-hidden">
          <div className="flex border-b border-gray-200 bg-gray-50">
            <button
              onClick={() => setVoucherStatusTab("CHO_XAC_NHAN")}
              className={`flex-1 py-3 text-sm font-bold ${voucherStatusTab === "CHO_XAC_NHAN" ? "text-blue-600 border-b-2 border-blue-600 bg-white" : "text-gray-500"}`}
            >
              Chờ xác nhận
            </button>
            <button
              onClick={() => setVoucherStatusTab("HOAN_THANH")}
              className={`flex-1 py-3 text-sm font-bold ${voucherStatusTab === "HOAN_THANH" ? "text-green-600 border-b-2 border-green-600 bg-white" : "text-gray-500"}`}
            >
              Hoàn thành
            </button>
            <button
              onClick={() => setVoucherStatusTab("DA_HUY")}
              className={`flex-1 py-3 text-sm font-bold ${voucherStatusTab === "DA_HUY" ? "text-red-600 border-b-2 border-red-600 bg-white" : "text-gray-500"}`}
            >
              Đã hủy
            </button>
          </div>

          <div className="p-4 flex justify-between items-center border-b border-gray-100">
            <h3 className="font-bold text-gray-800">
              Danh sách{" "}
              {viewMode === "PHIEU_NHAP" ? "Phiếu Nhập" : "Phiếu Xuất"} (
              {vouchers.filter((v) => v.trangThai === voucherStatusTab).length})
            </h3>
            <button
              disabled={!khoShopId}
              onClick={() =>
                openModal(viewMode === "PHIEU_NHAP" ? "NHAP" : "XUAT", {
                  hanhDong: voucherActionFilter,
                  shopId: khoShopId,
                })
              }
              className="px-5 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-bold shadow-sm disabled:opacity-50"
            >
              + Lập phiếu mới
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm cursor-pointer">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs font-bold">
                <tr>
                  <th className="py-3 px-6">Mã Phiếu</th>
                  <th className="py-3 px-6">Ngày tạo</th>
                  <th className="py-3 px-6">Nhà Cung Cấp / Shop</th>
                  <th className="py-3 px-6 text-right">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {vouchers
                  .filter((v) => v.trangThai === voucherStatusTab)
                  .map((v) => (
                    <tr
                      key={v.id}
                      className="hover:bg-blue-50 transition"
                      onClick={() => openVoucherDetail(v)}
                    >
                      <td className="py-4 px-6 font-bold text-gray-800">
                        #{v.id}
                      </td>
                      <td className="py-4 px-6 text-gray-600">
                        {new Date(v.ngayThucHien).toLocaleString("vi-VN")}
                      </td>
                      <td className="py-4 px-6 text-gray-600">
                        {v.hanhDong === "NHAP_DIEU_CHUYEN_NOI_BO" ? (
                          <span className="text-blue-600 font-bold">
                            Từ: {getTransferShopName(v.khoXuatId)}
                          </span>
                        ) : v.hanhDong === "XUAT_DIEU_CHUYEN_NOI_BO" ? (
                          <span className="text-orange-600 font-bold">
                            Đến: {getTransferShopName(v.khoXuatId)}
                          </span>
                        ) : v.tenDoiTac !== "Khác" &&
                          v.tenDoiTac !== "N/A" &&
                          v.tenDoiTac !== "Nội bộ" ? (
                          v.tenDoiTac
                        ) : (
                          v.tenCuaHang
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span className="text-blue-600 text-xs font-bold bg-blue-100 px-2 py-1 rounded-lg hover:underline">
                          🔍 Xem chi tiết
                        </span>
                      </td>
                    </tr>
                  ))}
                {vouchers.filter((v) => v.trangThai === voucherStatusTab)
                  .length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-500">
                      {!khoShopId
                        ? "Vui lòng chọn cửa hàng để xem phiếu."
                        : "Không có phiếu nào ở trạng thái này."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 🎯 BLOCK 3: LỊCH SỬ KIỂM KÊ (MỚI THÊM) */}
      {viewMode === "LICH_SU_KIEM_KE" && (
        <div className="bg-white rounded-2xl shadow-sm border border-purple-100 overflow-hidden">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-purple-50 text-purple-700 uppercase text-xs font-bold">
              <tr>
                <th className="py-3 px-6">Mã Kiểm Kê</th>
                <th className="py-3 px-6">Thời gian chốt</th>
                <th className="py-3 px-6">Số lượng món</th>
                <th className="py-3 px-6 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {auditHistory.map((h) => (
                <tr key={h.kiemKeId} className="hover:bg-purple-50 transition">
                  <td className="py-4 px-6 font-bold text-gray-800">
                    #KK-{h.kiemKeId}
                  </td>
                  <td className="py-4 px-6 text-gray-600">
                    {new Date(h.ngayThucHien).toLocaleString("vi-VN")}
                  </td>
                  <td className="py-4 px-6 font-bold text-purple-600">
                    {h.tongSoMon} món
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => openAuditDetail(h.kiemKeId)}
                      className="text-white bg-purple-500 hover:bg-purple-600 px-3 py-1.5 rounded-lg font-bold shadow-sm transition"
                    >
                      Xem chi tiết 🔍
                    </button>
                  </td>
                </tr>
              ))}
              {auditHistory.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="py-8 text-center text-gray-500 italic"
                  >
                    Chưa có lịch sử kiểm kê nào tại cửa hàng này. Nhấn "Lập
                    Phiếu" để kiểm kê ngay.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ========================================================= */}
      {/* VÙNG CHỨA CÁC MODAL (POPUP CỬA SỔ NỔI) */}
      {/* ========================================================= */}

      {/* MODAL CHI TIẾT PHIẾU (CŨ) */}
      {detailModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl">
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">
                Chi tiết Mã phiếu: #{detailModal.id}
              </h3>
              <button
                onClick={() => setDetailModal(null)}
                className="text-gray-400 hover:text-red-500 font-bold text-xl"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <div className="flex gap-4 mb-4 text-sm bg-blue-50 p-4 rounded-xl text-blue-800 font-medium">
                <p>
                  📍 Hành động:{" "}
                  <b className="uppercase">{detailModal.hanhDong}</b>
                </p>
                <p>
                  🕒 Ngày lập:{" "}
                  <b>
                    {new Date(detailModal.ngayThucHien).toLocaleString("vi-VN")}
                  </b>
                </p>
                {detailModal.hanhDong === "NHAP_DIEU_CHUYEN_NOI_BO" && (
                  <p>
                    Chuyển từ:{" "}
                    <b className="text-red-600">
                      {getTransferShopName(detailModal.khoXuatId)}
                    </b>
                  </p>
                )}
                {detailModal.hanhDong === "XUAT_DIEU_CHUYEN_NOI_BO" && (
                  <p>
                    Chuyển đến:{" "}
                    <b className="text-green-600">
                      {getTransferShopName(detailModal.khoXuatId)}
                    </b>
                  </p>
                )}
              </div>
              <table className="min-w-full text-left text-sm border border-gray-100 rounded-lg overflow-hidden">
                <thead className="bg-gray-100 text-gray-600 text-xs uppercase font-bold">
                  <tr>
                    <th className="py-2 px-4">Nguyên liệu</th>
                    <th className="py-2 px-4 text-center">SL</th>
                    <th className="py-2 px-4">Đơn vị</th>
                    <th className="py-2 px-4">Ghi chú</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {detailItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="py-3 px-4 font-bold text-gray-800">
                        {item.tenNguyenLieu}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-blue-600">
                        {item.soluong}
                      </td>
                      <td className="py-3 px-4 text-gray-600">{item.donVi}</td>
                      <td className="py-3 px-4 text-gray-500 italic">
                        {item.ghiChu || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              {detailModal.trangThai === "CHO_XAC_NHAN" ? (
                <>
                  <button
                    onClick={() =>
                      handleProcessVoucher(detailModal.id, "DA_HUY")
                    }
                    className="px-6 py-2.5 rounded-xl bg-red-100 text-red-700 font-bold hover:bg-red-200"
                  >
                    ❌ Hủy Phiếu
                  </button>
                  <button
                    onClick={() =>
                      handleProcessVoucher(detailModal.id, "HOAN_THANH")
                    }
                    className="px-6 py-2.5 rounded-xl bg-green-500 text-white font-bold hover:bg-green-600 shadow-md"
                  >
                    ✅ Duyệt Xác Nhận
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setDetailModal(null)}
                  className="px-6 py-2.5 rounded-xl bg-gray-200 text-gray-700 font-bold hover:bg-gray-300"
                >
                  Đóng lại
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 🎯 MODAL CHI TIẾT KIỂM KÊ (MỚI THÊM) */}
      {activeModal === "XEM_CHI_TIET_KIEM_KE" && detailAudit && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden">
            <div className="bg-purple-600 p-6 text-white flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold">
                  Lịch sử Kiểm Kê: #KK-{detailAudit.kiemKeId}
                </h3>
                <p className="text-purple-100 opacity-80 mt-1">
                  Chi nhánh:{" "}
                  <span className="font-bold">{detailAudit.tenCuaHang}</span> |
                  Lập lúc:{" "}
                  {new Date(detailAudit.ngayThucHien).toLocaleString("vi-VN")}
                </p>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="text-3xl hover:rotate-90 transition-transform"
              >
                ✕
              </button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto bg-gray-50">
              <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                <table className="min-w-full border-collapse text-sm">
                  <thead className="bg-gray-100 text-gray-600 uppercase text-xs font-black">
                    <tr>
                      <th className="p-4 text-left border-b border-gray-200">
                        Nguyên liệu
                      </th>
                      <th className="p-4 text-center border-b border-gray-200">
                        ĐVT
                      </th>
                      <th className="p-4 text-center border-b border-gray-200 bg-gray-50 border-r">
                        Tồn hệ thống
                      </th>
                      <th className="p-4 text-center border-b border-gray-200 bg-purple-50 text-purple-800">
                        Thực tế đếm
                      </th>
                      <th className="p-4 text-center border-b border-gray-200">
                        Chênh lệch
                      </th>
                      <th className="p-4 text-left border-b border-gray-200">
                        Ghi chú (Lý do)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {detailAudit.danhSachChiTiet &&
                      detailAudit.danhSachChiTiet.map((item) => (
                        <tr
                          key={item.id}
                          className="hover:bg-purple-50/50 transition"
                        >
                          <td className="p-4 font-bold text-gray-800">
                            {item.tenNguyenLieu}
                          </td>
                          <td className="p-4 text-center text-gray-500">
                            {item.donVi}
                          </td>
                          <td className="p-4 text-center font-mono text-gray-500 bg-gray-50 border-r">
                            {item.tonHeThong}
                          </td>
                          <td className="p-4 text-center font-mono font-black text-purple-700 bg-purple-50/30 text-lg">
                            {item.tonThucTe}
                          </td>
                          <td className="p-4 text-center font-black text-lg">
                            {item.chenhLech > 0 ? (
                              <span className="text-green-600 bg-green-100 px-2 py-1 rounded">
                                +{item.chenhLech}
                              </span>
                            ) : item.chenhLech < 0 ? (
                              <span className="text-red-600 bg-red-100 px-2 py-1 rounded">
                                {item.chenhLech}
                              </span>
                            ) : (
                              <span className="text-gray-300">0</span>
                            )}
                          </td>
                          <td className="p-4 text-sm text-gray-500 italic">
                            {item.ghiChu || "---"}
                          </td>
                        </tr>
                      ))}
                    {(!detailAudit.danhSachChiTiet ||
                      detailAudit.danhSachChiTiet.length === 0) && (
                      <tr>
                        <td
                          colSpan={6}
                          className="p-8 text-center text-gray-400"
                        >
                          Không có dữ liệu chi tiết.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-5 border-t border-gray-200 bg-white flex justify-end">
              <button
                onClick={() => setActiveModal(null)}
                className="px-8 py-2.5 bg-gray-100 text-gray-700 hover:bg-gray-200 transition rounded-xl font-bold"
              >
                Đóng lại
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NHẬP / XUẤT (CŨ) */}
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
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm"
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
                    {activeModal === "NHAP"
                      ? "Tại Cửa Hàng (Nhận)"
                      : "Từ Cửa Hàng (Xuất)"}
                  </label>
                  <select
                    required
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm"
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
                        {s.shopName || s.tenCuaHang || "Chưa có tên"}
                      </option>
                    ))}
                  </select>
                </div>
                {formData.hanhDong === "XUAT_DIEU_CHUYEN_NOI_BO" && (
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-blue-600 uppercase">
                      ✈️ Đến Cửa Hàng Nhận
                    </label>
                    <select
                      required
                      className="w-full bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 text-sm font-bold text-blue-800"
                      value={formData.khoNhapId}
                      onChange={(e) =>
                        setFormData({ ...formData, khoNhapId: e.target.value })
                      }
                    >
                      <option value="">-- Chọn cửa hàng đích --</option>
                      {shops
                        .filter(
                          (s) =>
                            String(s.cuaHangId || s.shopId || s.id) !==
                            String(formData.shopId),
                        )
                        .map((s) => (
                          <option
                            key={s.cuaHangId || s.shopId || s.id}
                            value={s.cuaHangId || s.shopId || s.id}
                          >
                            {s.shopName || s.tenCuaHang}
                          </option>
                        ))}
                    </select>
                  </div>
                )}
                {(formData.hanhDong === "NHAP_NCC" ||
                  formData.hanhDong === "XUAT_TRA_NCC") && (
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-gray-600 uppercase">
                      Nhà Cung Cấp
                    </label>
                    <select
                      required
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm"
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
                    className="px-4 py-1.5 bg-blue-100 text-blue-700 font-bold rounded-lg"
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
                              className="w-full border border-gray-300 rounded p-1.5"
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
                              className="w-full border border-gray-300 rounded p-1.5"
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
                              className="w-full border border-gray-300 rounded p-1.5"
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
                              className="w-full border border-gray-300 rounded p-1.5 font-bold text-blue-600"
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
                              className="w-full border border-gray-300 rounded p-1.5"
                              value={item.GiaNhap}
                              onChange={(e) =>
                                updateItemRow(idx, "GiaNhap", e.target.value)
                              }
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="date"
                              className="w-full border border-gray-300 rounded p-1.5"
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
                              className="w-full border border-gray-300 rounded p-1.5"
                              value={item.HanSuDung}
                              onChange={(e) =>
                                updateItemRow(idx, "HanSuDung", e.target.value)
                              }
                            />
                          </td>
                          <td className="p-2">
                            <input
                              className="w-full border border-gray-300 rounded p-1.5"
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
                              className="text-red-500 font-bold"
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
                  className="px-6 py-2.5 rounded-xl bg-gray-100 font-bold"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-2.5 rounded-xl bg-blue-500 text-white font-bold"
                >
                  {loading ? "Đang tạo..." : "Lưu Phiếu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL LẬP KIỂM KÊ (CŨ) */}
      {activeModal === "KIEMKE" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center z-10">
              <h3 className="text-xl font-bold text-gray-800">
                📋 Phiếu Kiểm Kê Kho
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="text-gray-400 font-bold text-xl"
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
                    className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2 text-sm"
                    value={auditShopId}
                    onChange={(e) => setAuditShopId(e.target.value)}
                  >
                    <option value="">-- Chọn cửa hàng --</option>
                    {shops.map((s) => (
                      <option
                        key={s.cuaHangId || s.shopId || s.id}
                        value={s.cuaHangId || s.shopId || s.id}
                      >
                        {s.shopName || s.tenCuaHang}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={loadKiemKeData}
                  disabled={!auditShopId || loadingAudit}
                  className="px-5 py-2 rounded-xl bg-purple-600 text-white font-bold"
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
                    className="px-3 py-1.5 bg-gray-100 text-gray-600 font-bold rounded-lg text-xs"
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
                        <th className="px-4 py-3">Tồn Thực Tế</th>
                        <th className="px-4 py-3 text-center">Chênh lệch</th>
                        <th className="px-4 py-3">Lý do</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {auditItems.map((item, idx) => {
                        const tonTT = parseFloat(item.TonThucTe) || 0;
                        const tonHT = parseFloat(item.TonHeThong) || 0;
                        const diff = tonTT - tonHT;
                        return (
                          <tr key={idx} className="bg-white">
                            <td className="px-4 py-2 font-semibold">
                              {item.TenNguyenLieu ? (
                                item.TenNguyenLieu
                              ) : (
                                <select
                                  className="w-full border p-1 rounded"
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
                                className="w-24 border border-purple-300 rounded p-1.5 font-bold text-purple-700"
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
                                className="w-full border border-gray-300 rounded p-1.5"
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
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="px-6 py-2.5 rounded-xl bg-gray-100 font-bold"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={loading || auditItems.length === 0}
                    className="px-8 py-2.5 rounded-xl bg-purple-600 text-white font-bold"
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
