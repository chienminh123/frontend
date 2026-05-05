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

const DiscountTab = () => {
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchDiscountKey, setSearchDiscountKey] = useState("");
  const [newDiscount, setNewDiscount] = useState({
    Code: "",
    LoaiMa: "Persent",
    MaxValue: "",
    SoLuong: "",
    NgayBatDau: "",
    NgayKetThuc: "",
  });
  const [editingDiscount, setEditingDiscount] = useState(null);

  const authHeaders = useMemo(
    () => ({ Authorization: `Bearer ${getAdminToken()}` }),
    [],
  );

  useEffect(() => {
    const fetchDiscounts = async () => {
      try {
        setLoading(true);
        const res = await api.get("/admin/Discount", { headers: authHeaders });
        const data = res.data;
        setDiscounts(
          Array.isArray(data) ? data : data?.data || data?.discounts || [],
        );
      } catch (err) {
        alert("Lỗi tải mã giảm giá");
      } finally {
        setLoading(false);
      }
    };
    fetchDiscounts();
  }, [authHeaders]);

  const handleSearchDiscount = async (key) => {
    try {
      setLoading(true);
      const url = key
        ? `/admin/Discount/search-discount-by-code?code=${encodeURIComponent(key)}`
        : "/admin/Discount";
      const res = await api.get(url, { headers: authHeaders });
      const data = res.data;
      setDiscounts(
        Array.isArray(data) ? data : data?.data || data?.discounts || [],
      );
    } catch (err) {
      alert("Lỗi tìm kiếm mã giảm giá");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDiscount = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const form = new FormData();
      form.append("Code", newDiscount.Code);
      form.append("LoaiMa", newDiscount.LoaiMa);
      form.append("MaxValue", newDiscount.MaxValue.toString());
      form.append("SoLuong", newDiscount.SoLuong.toString());
      form.append("NgayBatDau", newDiscount.NgayBatDau);
      form.append("NgayKetThuc", newDiscount.NgayKetThuc);
      await api.post("/admin/Discount", form, { headers: authHeaders });
      await handleSearchDiscount(searchDiscountKey);
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
      alert("Lỗi tạo mã giảm giá");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDiscount = async (e) => {
    e.preventDefault();
    if (!editingDiscount) return;
    try {
      setLoading(true);
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
        { headers: authHeaders },
      );
      await handleSearchDiscount(searchDiscountKey);
      setEditingDiscount(null);
      alert("Cập nhật thành công!");
    } catch (err) {
      alert("Lỗi cập nhật mã giảm giá");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDiscount = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa mã giảm giá này?")) return;
    try {
      setLoading(true);
      await api.delete(`/admin/Discount?id=${id}`, { headers: authHeaders });
      await handleSearchDiscount(searchDiscountKey);
    } catch (err) {
      alert("Lỗi xóa mã giảm giá");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.5fr,1fr] animate-fade-in">
      <section className="space-y-4">
        <input
          type="text"
          placeholder="Tìm theo mã code..."
          className="w-full max-w-md bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          value={searchDiscountKey}
          onChange={(e) => {
            setSearchDiscountKey(e.target.value);
            handleSearchDiscount(e.target.value);
          }}
        />
        <div className="rounded-2xl bg-white border border-green-100 overflow-hidden shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase font-bold text-green-700 bg-green-50">
              <tr>
                <th className="py-3 px-4">Mã Code</th>
                <th className="py-3 px-4">Giảm giá</th>
                <th className="py-3 px-4">Số lượng</th>
                <th className="py-3 px-4">Thời hạn</th>
                <th className="py-3 px-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {discounts.map((d, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="py-3 px-4 font-black text-blue-600 tracking-wider">
                    {d.code || d.Code}
                  </td>
                  <td className="py-3 px-4 font-bold text-green-600">
                    {d.loaiMa === "Fixed" || d.LoaiMa === "Fixed"
                      ? `${(d.maxValue || d.MaxValue)?.toLocaleString()}₫`
                      : `${d.maxValue || d.MaxValue}%`}
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {d.soLuong || d.SoLuong}
                  </td>
                  <td className="py-3 px-4 text-xs text-gray-500">
                    {d.ngayBatDau?.slice(0, 10)} <br />
                    đến {d.ngayKetThuc?.slice(0, 10)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      className="text-blue-500 hover:underline mr-3"
                      onClick={() =>
                        setEditingDiscount({
                          id: d.id,
                          code: d.code || d.Code || "",
                          loaiMa: d.loaiMa || d.LoaiMa || "Persent",
                          maxValue: d.maxValue || d.MaxValue || 0,
                          soLuong: d.soLuong || d.SoLuong || 0,
                          ngayBatDau: d.ngayBatDau || d.NgayBatDau || "",
                          ngayKetThuc: d.ngayKetThuc || d.NgayKetThuc || "",
                        })
                      }
                    >
                      Sửa
                    </button>
                    <button
                      className="text-red-500 hover:underline"
                      onClick={() => handleDeleteDiscount(d.id)}
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl bg-white border border-green-100 p-6 shadow-sm h-fit">
        <h3 className="text-lg font-bold text-gray-800 mb-5">
          {editingDiscount ? "✏️ Sửa mã giảm giá" : "✨ Thêm mã giảm giá"}
        </h3>
        <form
          className="space-y-4 text-sm"
          onSubmit={
            editingDiscount ? handleUpdateDiscount : handleCreateDiscount
          }
        >
          <div className="space-y-1">
            <label className="block font-bold text-gray-700">
              Mã Code (Nhập liền không dấu)
            </label>
            <input
              type="text"
              required
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-green-500 uppercase"
              value={editingDiscount ? editingDiscount.code : newDiscount.Code}
              onChange={(e) =>
                editingDiscount
                  ? setEditingDiscount({
                      ...editingDiscount,
                      code: e.target.value,
                    })
                  : setNewDiscount({ ...newDiscount, Code: e.target.value })
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block font-bold text-gray-700">Loại mã</label>
              <select
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-green-500"
                value={
                  editingDiscount ? editingDiscount.loaiMa : newDiscount.LoaiMa
                }
                onChange={(e) =>
                  editingDiscount
                    ? setEditingDiscount({
                        ...editingDiscount,
                        loaiMa: e.target.value,
                      })
                    : setNewDiscount({ ...newDiscount, LoaiMa: e.target.value })
                }
              >
                <option value="Persent">Phần trăm (%)</option>
                <option value="Fixed">Cố định (VNĐ)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="block font-bold text-gray-700">Mức giảm</label>
              <input
                type="number"
                required
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-green-500"
                value={
                  editingDiscount
                    ? editingDiscount.maxValue
                    : newDiscount.MaxValue
                }
                onChange={(e) =>
                  editingDiscount
                    ? setEditingDiscount({
                        ...editingDiscount,
                        maxValue: parseFloat(e.target.value) || 0,
                      })
                    : setNewDiscount({
                        ...newDiscount,
                        MaxValue: e.target.value,
                      })
                }
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="block font-bold text-gray-700">Số lượng mã</label>
            <input
              type="number"
              required
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-green-500"
              value={
                editingDiscount ? editingDiscount.soLuong : newDiscount.SoLuong
              }
              onChange={(e) =>
                editingDiscount
                  ? setEditingDiscount({
                      ...editingDiscount,
                      soLuong: parseInt(e.target.value) || 0,
                    })
                  : setNewDiscount({ ...newDiscount, SoLuong: e.target.value })
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block font-bold text-gray-700">
                Ngày bắt đầu
              </label>
              <input
                type="date"
                required
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-green-500"
                value={
                  editingDiscount
                    ? editingDiscount.ngayBatDau?.slice(0, 10)
                    : newDiscount.NgayBatDau
                }
                onChange={(e) =>
                  editingDiscount
                    ? setEditingDiscount({
                        ...editingDiscount,
                        ngayBatDau: e.target.value,
                      })
                    : setNewDiscount({
                        ...newDiscount,
                        NgayBatDau: e.target.value,
                      })
                }
              />
            </div>
            <div className="space-y-1">
              <label className="block font-bold text-gray-700">
                Ngày kết thúc
              </label>
              <input
                type="date"
                required
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-green-500"
                value={
                  editingDiscount
                    ? editingDiscount.ngayKetThuc?.slice(0, 10)
                    : newDiscount.NgayKetThuc
                }
                onChange={(e) =>
                  editingDiscount
                    ? setEditingDiscount({
                        ...editingDiscount,
                        ngayKetThuc: e.target.value,
                      })
                    : setNewDiscount({
                        ...newDiscount,
                        NgayKetThuc: e.target.value,
                      })
                }
              />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 rounded-xl bg-green-500 font-bold text-white hover:bg-green-600 shadow-sm"
            >
              {editingDiscount ? "Lưu Cập Nhật" : "Tạo Mã Code"}
            </button>
            {editingDiscount && (
              <button
                type="button"
                onClick={() => setEditingDiscount(null)}
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

export default DiscountTab;
