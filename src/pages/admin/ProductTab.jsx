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

const ProductTab = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchProductKey, setSearchProductKey] = useState("");
  const [categories, setCategories] = useState([]);
  const [ingredients, setIngredients] = useState([]);
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
  const [editingProduct, setEditingProduct] = useState(null);

  const authHeaders = useMemo(
    () => ({ Authorization: `Bearer ${getAdminToken()}` }),
    [],
  );

  // SỬA ĐỔI: Gọi 3 API cùng lúc để lấy Sản phẩm, Thể loại và Nguyên liệu
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [resProd, resCat, resIng] = await Promise.all([
          api.get("/admin/Product", { headers: authHeaders }),
          api.get("/admin/Genre", { headers: authHeaders }),
          api.get("/admin/Kho", { headers: authHeaders }), // Lấy từ GetAllMaterial của KhoController
        ]);

        // 1. Set Sản phẩm
        const pData = resProd.data;
        setProducts(
          Array.isArray(pData) ? pData : pData?.data || pData?.products || [],
        );

        // 2. Set Thể loại (Genre)
        const cData = resCat.data;
        setCategories(Array.isArray(cData) ? cData : cData?.data || []);

        // 3. Set Nguyên liệu (Material)
        const iData = resIng.data;
        setIngredients(Array.isArray(iData) ? iData : iData?.data || []);
      } catch (err) {
        alert("Lỗi tải dữ liệu sản phẩm, thể loại hoặc nguyên liệu!");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [authHeaders]);

  const handleSearchProduct = async (key) => {
    try {
      setLoading(true);
      const url = key
        ? `/admin/Product/search-by-name?keyword=${encodeURIComponent(key)}`
        : "/admin/Product";
      const res = await api.get(url, { headers: authHeaders });
      const data = res.data;
      setProducts(
        Array.isArray(data) ? data : data?.data || data?.products || [],
      );
    } catch (err) {
      alert("Lỗi tìm kiếm sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
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

      // Load lại danh sách sản phẩm sau khi tạo
      await handleSearchProduct(searchProductKey);

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
      alert("Lỗi tạo sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      setLoading(true);
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
      alert("Lỗi cập nhật sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa sản phẩm này?")) return;
    try {
      setLoading(true);
      await api.delete(`/admin/Product/${id}`, { headers: authHeaders });
      await handleSearchProduct(searchProductKey);
    } catch (err) {
      alert("Lỗi xóa sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1.4fr,1fr] animate-fade-in">
      <section className="space-y-4">
        <input
          type="text"
          placeholder="Tìm theo tên sản phẩm..."
          className="w-full max-w-md bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          value={searchProductKey}
          onChange={(e) => {
            setSearchProductKey(e.target.value);
            handleSearchProduct(e.target.value);
          }}
        />
        <div className="rounded-2xl bg-white border border-green-100 overflow-hidden shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase font-bold text-green-700 bg-green-50">
              <tr>
                <th className="py-3 px-4">Sản phẩm</th>
                <th className="py-3 px-4">Thể loại</th>
                <th className="py-3 px-4">Size</th>
                <th className="py-3 px-4">Giá bán</th>
                <th className="py-3 px-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((p, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="py-3 px-4 font-bold text-gray-800">
                    {p.sanPhamName}
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {p.theLoai?.theLoaiName}
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {p.size || p.Size}
                  </td>
                  <td className="py-3 px-4 font-bold text-green-600">
                    {(p.giaBan || p.GiaBan)?.toLocaleString("vi-VN")}₫
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      className="text-blue-500 hover:underline mr-3"
                      onClick={() =>
                        setEditingProduct({
                          id: p.sanPhamId || p.id,
                          name: p.sanPhamName || "",
                          theLoaiId: p.theLoaiId || p.TheLoaiId || "",
                          nguyenLieuId: p.nguyenLieuId || p.NguyenLieuId || "",
                          size: p.size || p.Size || "",
                          mota: p.mota || p.MoTa || "",
                          giaBan: p.giaBan || p.GiaBan || "",
                          isActive: p.isActive ?? p.IsActive ?? true,
                          hinhAnhUpload: null,
                        })
                      }
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
                  <td colSpan={5} className="py-4 text-center text-gray-500">
                    Chưa có sản phẩm nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl bg-white border border-green-100 p-6 shadow-sm h-fit">
        <h3 className="text-lg font-bold text-gray-800 mb-5">
          {editingProduct ? "✏️ Sửa sản phẩm" : "✨ Thêm sản phẩm"}
        </h3>
        <form
          className="space-y-3 text-sm"
          onSubmit={editingProduct ? handleUpdateProduct : handleCreateProduct}
        >
          <div className="space-y-1">
            <label className="block font-bold text-gray-700">Tên món</label>
            <input
              type="text"
              required
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-green-500"
              value={
                editingProduct ? editingProduct.name : newProduct.SanPhamName
              }
              onChange={(e) =>
                editingProduct
                  ? setEditingProduct({
                      ...editingProduct,
                      name: e.target.value,
                    })
                  : setNewProduct({
                      ...newProduct,
                      SanPhamName: e.target.value,
                    })
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block font-bold text-gray-700">Thể loại</label>
              <select
                required
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-green-500"
                value={
                  editingProduct
                    ? editingProduct.theLoaiId
                    : newProduct.TheLoaiId
                }
                onChange={(e) =>
                  editingProduct
                    ? setEditingProduct({
                        ...editingProduct,
                        theLoaiId: e.target.value,
                      })
                    : setNewProduct({
                        ...newProduct,
                        TheLoaiId: e.target.value,
                      })
                }
              >
                <option value="">Chọn loại</option>
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
            <div className="space-y-1">
              <label className="block font-bold text-gray-700">
                Nguyên liệu
              </label>
              <select
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-green-500"
                value={
                  editingProduct
                    ? editingProduct.nguyenLieuId
                    : newProduct.NguyenLieuId
                }
                onChange={(e) =>
                  editingProduct
                    ? setEditingProduct({
                        ...editingProduct,
                        nguyenLieuId: e.target.value,
                      })
                    : setNewProduct({
                        ...newProduct,
                        NguyenLieuId: e.target.value,
                      })
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
            <div className="space-y-1">
              <label className="block font-bold text-gray-700">Size</label>
              <input
                type="text"
                required
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-green-500"
                value={editingProduct ? editingProduct.size : newProduct.Size}
                onChange={(e) =>
                  editingProduct
                    ? setEditingProduct({
                        ...editingProduct,
                        size: e.target.value,
                      })
                    : setNewProduct({ ...newProduct, Size: e.target.value })
                }
              />
            </div>
            <div className="space-y-1">
              <label className="block font-bold text-gray-700">Giá bán</label>
              <input
                type="number"
                required
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-green-500"
                value={
                  editingProduct ? editingProduct.giaBan : newProduct.GiaBan
                }
                onChange={(e) =>
                  editingProduct
                    ? setEditingProduct({
                        ...editingProduct,
                        giaBan: e.target.value,
                      })
                    : setNewProduct({ ...newProduct, GiaBan: e.target.value })
                }
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="block font-bold text-gray-700">Mô tả</label>
            <textarea
              rows={2}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-green-500"
              value={editingProduct ? editingProduct.mota : newProduct.MoTa}
              onChange={(e) =>
                editingProduct
                  ? setEditingProduct({
                      ...editingProduct,
                      mota: e.target.value,
                    })
                  : setNewProduct({ ...newProduct, MoTa: e.target.value })
              }
            />
          </div>
          <div className="space-y-1">
            <label className="block font-bold text-gray-700">
              Trạng thái bán
            </label>
            <select
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-green-500"
              value={
                editingProduct ? editingProduct.isActive : newProduct.IsActive
              }
              onChange={(e) =>
                editingProduct
                  ? setEditingProduct({
                      ...editingProduct,
                      isActive: e.target.value === "true",
                    })
                  : setNewProduct({
                      ...newProduct,
                      IsActive: e.target.value === "true",
                    })
              }
            >
              <option value="true">Đang bán</option>
              <option value="false">Ngưng bán</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="block font-bold text-gray-700">
              Ảnh sản phẩm
            </label>
            <input
              type="file"
              accept="image/*"
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-green-50 file:text-green-700 cursor-pointer"
              onChange={(e) =>
                editingProduct
                  ? setEditingProduct({
                      ...editingProduct,
                      hinhAnhUpload: e.target.files?.[0] || null,
                    })
                  : setNewProduct({
                      ...newProduct,
                      HinhAnhUpload: e.target.files?.[0] || null,
                    })
              }
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 rounded-xl bg-green-500 font-bold text-white hover:bg-green-600 shadow-sm"
            >
              {editingProduct ? "Lưu Cập Nhật" : "Tạo Món Mới"}
            </button>
            {editingProduct && (
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="flex-1 px-4 py-3 rounded-xl bg-gray-200 font-bold text-gray-700 hover:bg-gray-300"
              >
                Hủy
              </button>
            )}
          </div>
        </form>
      </section>
    </div>
  );
};

export default ProductTab;
