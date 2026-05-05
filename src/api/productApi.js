// import axiosClient from "./axiosClient";

// const getApiOrigin = () => {
//   const base = axiosClient?.defaults?.baseURL || "";
//   return base.replace(/\/api\/?$/, "");
// };

// const toAbsoluteUrl = (maybeRelativeUrl) => {
//   if (!maybeRelativeUrl) return "";
//   if (
//     typeof maybeRelativeUrl === "string" &&
//     (maybeRelativeUrl.startsWith("http://") ||
//       maybeRelativeUrl.startsWith("https://") ||
//       maybeRelativeUrl.startsWith("data:"))
//   ) {
//     return maybeRelativeUrl;
//   }
//   if (
//     typeof maybeRelativeUrl === "string" &&
//     maybeRelativeUrl.startsWith("/")
//   ) {
//     return `${getApiOrigin()}${maybeRelativeUrl}`;
//   }
//   return String(maybeRelativeUrl);
// };

// const normalizeProduct = (p) => {
//   if (!p || typeof p !== "object") return null;
//   return {
//     id: p.sanPhamId ?? p.SanPhamId ?? p.id ?? p.Id,
//     name: p.sanPhamName ?? p.SanPhamName ?? p.name ?? "",
//     description: p.moTa ?? p.MoTa ?? "",
//     size: p.size ?? p.Size ?? "",
//     price: Number(p.giaBan ?? p.GiaBan ?? 0),
//     isActive: Boolean(p.isActive ?? p.IsActive ?? false),
//     imageUrl: toAbsoluteUrl(p.hinhAnh ?? p.HinhAnh ?? ""),
//     genreName:
//       p.theLoai?.theLoaiName ?? p.TheLoai?.TheLoaiName ?? p.genreName ?? "",
//     raw: p,
//   };
// };

// const productApi = {
//   async getAll() {
//     const res = await axiosClient.get("/admin/Product");
//     const data = res?.data;
//     const list = Array.isArray(data) ? data : data?.data || data?.items || [];
//     return list.map(normalizeProduct).filter(Boolean);
//   },

//   async getById(id) {
//     if (!id) throw new Error("Product ID is required");
//     const res = await axiosClient.get(`/admin/Product/search-by-id?id=${id}`);
//     const data = res?.data;
//     const normalized = normalizeProduct(data);
//     if (!normalized) throw new Error("Sản phẩm không tồn tại");
//     return normalized;
//   },
// };

// export default productApi;
import axiosClient from "./axiosClient";

const getApiOrigin = () => {
  const base = axiosClient?.defaults?.baseURL || "";
  return base.replace(/\/api\/?$/, "");
};

const toAbsoluteUrl = (maybeRelativeUrl) => {
  if (!maybeRelativeUrl) return "";
  if (
    typeof maybeRelativeUrl === "string" &&
    (maybeRelativeUrl.startsWith("http://") ||
      maybeRelativeUrl.startsWith("https://") ||
      maybeRelativeUrl.startsWith("data:"))
  ) {
    return maybeRelativeUrl;
  }
  if (
    typeof maybeRelativeUrl === "string" &&
    maybeRelativeUrl.startsWith("/")
  ) {
    return `${getApiOrigin()}${maybeRelativeUrl}`;
  }
  return String(maybeRelativeUrl);
};

// Hàm này CHỈ DÙNG CHO ADMIN (Không dùng cho Client)
const normalizeProduct = (p) => {
  if (!p || typeof p !== "object") return null;
  return {
    id: p.sanPhamId ?? p.SanPhamId ?? p.id ?? p.Id,
    name: p.sanPhamName ?? p.SanPhamName ?? p.name ?? "",
    description: p.moTa ?? p.MoTa ?? "",
    size: p.size ?? p.Size ?? "",
    price: Number(p.giaBan ?? p.GiaBan ?? 0),
    isActive: Boolean(p.isActive ?? p.IsActive ?? false),
    imageUrl: toAbsoluteUrl(p.hinhAnh ?? p.HinhAnh ?? ""),
    genreName:
      p.theLoai?.theLoaiName ?? p.TheLoai?.TheLoaiName ?? p.genreName ?? "",
    raw: p,
  };
};

const productApi = {
  // =====================================
  // 1. CÁC API CỦA TRANG ADMIN
  // =====================================
  async getAll() {
    const res = await axiosClient.get("/admin/Product");
    const data = res?.data;
    const list = Array.isArray(data) ? data : data?.data || data?.items || [];
    return list.map(normalizeProduct).filter(Boolean);
  },

  async getById(id) {
    if (!id) throw new Error("Product ID is required");
    const res = await axiosClient.get(`/admin/Product/search-by-id?id=${id}`);
    const data = res?.data;
    const normalized = normalizeProduct(data);
    if (!normalized) throw new Error("Sản phẩm không tồn tại");
    return normalized;
  },

  // =====================================
  // 2. API DÀNH RIÊNG CHO TRANG KHÁCH HÀNG
  // =====================================
  async getMenuClient() {
    const res = await axiosClient.get("/client/menu/get-all");
    const data = res?.data;
    const list = Array.isArray(data) ? data : data?.data || data?.items || [];

    // Giữ nguyên cấu trúc gộp nhóm của C#, CHỈ NÂNG CẤP URL ẢNH ĐỂ KHÔNG BỊ LỖI HIỂN THỊ
    return list.map((item) => ({
      ...item,
      // Đảm bảo tên biến viết thường giống C# trả về (sanPhamName, hinhAnh, giaBanTu...)
      hinhAnh: toAbsoluteUrl(item.hinhAnh || item.HinhAnh || ""),
    }));
  },
};

export default productApi;
