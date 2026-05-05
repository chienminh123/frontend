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

const PartnerTab = () => {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(false);

  // States cho tính năng tìm kiếm đa tiêu chí
  const [searchPartnerKey, setSearchPartnerKey] = useState("");
  const [searchPartnerType, setSearchPartnerType] = useState("name");

  const [newPartner, setNewPartner] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });
  const [editingPartner, setEditingPartner] = useState(null);

  const authHeaders = useMemo(
    () => ({ Authorization: `Bearer ${getAdminToken()}` }),
    [],
  );

  const fetchPartners = async () => {
    try {
      setLoading(true);
      const res = await api.get("/DoiTac", { headers: authHeaders });
      const data = res.data;
      setPartners(
        Array.isArray(data) ? data : data?.data || data?.partners || [],
      );
    } catch (err) {
      alert("Lỗi tải danh sách đối tác");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, [authHeaders]);

  const handleSearchPartner = async (e) => {
    if (e) e.preventDefault(); // Ngăn chặn load lại trang khi submit form
    try {
      setLoading(true);
      const key = searchPartnerKey.trim();
      let url = "/DoiTac";

      // Điều hướng gọi API dựa vào Type mà người dùng chọn
      if (key) {
        switch (searchPartnerType) {
          case "name":
            url = `/DoiTac/search_by_name?key=${encodeURIComponent(key)}`;
            break;
          case "phone":
            url = `/DoiTac/search_by_phone?key=${encodeURIComponent(key)}`;
            break;
          case "address":
            url = `/DoiTac/search_by_address?key=${encodeURIComponent(key)}`;
            break;
          case "id":
            url = `/DoiTac/search_by_id?id=${encodeURIComponent(key)}`;
            break;
          default:
            url = "/DoiTac";
        }
      }

      const res = await api.get(url, { headers: authHeaders });
      const data = res.data;

      // Xử lý dữ liệu trả về: search_by_id trả về 1 object, các hàm khác trả về Array
      if (Array.isArray(data)) {
        setPartners(data);
      } else if (data && typeof data === "object") {
        setPartners(data.id ? [data] : []); // Nếu có ID tức là 1 object đối tác, bọc nó vào mảng
      } else {
        setPartners([]);
      }
    } catch (err) {
      // Backend ném 404 Not Found nếu không có đối tác nào khớp
      if (err?.response?.status === 404) {
        setPartners([]);
      } else {
        alert("Lỗi tìm kiếm đối tác");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetSearch = () => {
    setSearchPartnerKey("");
    setSearchPartnerType("name");
    fetchPartners(); // Load lại toàn bộ danh sách gốc
  };

  const handleCreatePartner = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const form = new FormData();
      form.append("name", newPartner.name);
      form.append("phone", newPartner.phone);
      form.append("email", newPartner.email);
      form.append("address", newPartner.address);
      await api.post("/DoiTac", form, { headers: authHeaders });
      await handleSearchPartner();
      setNewPartner({ name: "", phone: "", email: "", address: "" });
      alert("Tạo đối tác thành công!");
    } catch (err) {
      alert("Lỗi tạo đối tác");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePartner = async (e) => {
    e.preventDefault();
    if (!editingPartner) return;
    try {
      setLoading(true);
      const form = new FormData();
      form.append("name", editingPartner.name);
      form.append("phone", editingPartner.phone);
      form.append("email", editingPartner.email);
      form.append("address", editingPartner.address);
      await api.put(`/DoiTac?id=${editingPartner.id}`, form, {
        headers: authHeaders,
      });
      await handleSearchPartner();
      setEditingPartner(null);
      alert("Cập nhật đối tác thành công!");
    } catch (err) {
      alert("Lỗi cập nhật đối tác");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePartner = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa đối tác này?")) return;
    try {
      setLoading(true);
      await api.delete(`/DoiTac?id=${id}`, { headers: authHeaders });
      await handleSearchPartner();
    } catch (err) {
      alert("Lỗi xóa đối tác");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.5fr,1fr] animate-fade-in">
      <section className="space-y-4">
        {/* THANH TÌM KIẾM ĐA TIÊU CHÍ */}
        <form
          onSubmit={handleSearchPartner}
          className="flex flex-col sm:flex-row gap-2 w-full items-stretch sm:items-center bg-white p-3 rounded-2xl shadow-sm border border-green-100"
        >
          <select
            className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 font-medium sm:w-40"
            value={searchPartnerType}
            onChange={(e) => setSearchPartnerType(e.target.value)}
          >
            <option value="name">Theo tên</option>
            <option value="phone">Theo SĐT</option>
            <option value="address">Theo địa chỉ</option>
            <option value="id">Theo mã đối tác (ID)</option>
          </select>
          <input
            type="text"
            placeholder="Nhập từ khóa..."
            className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 shadow-inner"
            value={searchPartnerKey}
            onChange={(e) => setSearchPartnerKey(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-green-500 text-sm font-bold text-white shadow-sm hover:bg-green-600 transition whitespace-nowrap disabled:opacity-60"
          >
            Tìm
          </button>
          <button
            type="button"
            onClick={handleResetSearch}
            className="px-5 py-2.5 rounded-xl bg-gray-100 text-sm font-bold text-gray-600 shadow-sm hover:bg-gray-200 transition whitespace-nowrap"
          >
            Tải lại
          </button>
        </form>

        <div className="rounded-2xl bg-white border border-green-100 overflow-hidden shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase font-bold text-green-700 bg-green-50">
              <tr>
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">Tên đối tác</th>
                <th className="py-3 px-4">Liên hệ</th>
                <th className="py-3 px-4">Địa chỉ</th>
                <th className="py-3 px-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {partners.map((p, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono text-gray-400">#{p.id}</td>
                  <td className="py-3 px-4 font-bold text-gray-800">
                    {p.name}
                  </td>
                  <td className="py-3 px-4 text-gray-600 text-xs">
                    <p>{p.phone}</p>
                    <p>{p.email}</p>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{p.address}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      className="text-blue-500 hover:underline mr-3 font-semibold"
                      onClick={() =>
                        setEditingPartner({
                          id: p.id,
                          name: p.name || "",
                          phone: p.phone || "",
                          email: p.email || "",
                          address: p.address || "",
                        })
                      }
                    >
                      Sửa
                    </button>
                    <button
                      className="text-red-500 hover:underline font-semibold"
                      onClick={() => handleDeletePartner(p.id)}
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
                    className="py-8 text-center text-gray-500 italic"
                  >
                    Không tìm thấy dữ liệu đối tác nào khớp với từ khóa.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl bg-white border border-green-100 p-6 shadow-sm h-fit">
        <h3 className="text-lg font-bold text-gray-800 mb-4">
          {editingPartner ? "✏️ Sửa đối tác" : "✨ Thêm đối tác mới"}
        </h3>
        <form
          className="space-y-4 text-sm"
          onSubmit={editingPartner ? handleUpdatePartner : handleCreatePartner}
        >
          <div className="space-y-1">
            <label className="block font-bold text-gray-700">Tên đối tác</label>
            <input
              type="text"
              required
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-green-500"
              value={editingPartner ? editingPartner.name : newPartner.name}
              onChange={(e) =>
                editingPartner
                  ? setEditingPartner({
                      ...editingPartner,
                      name: e.target.value,
                    })
                  : setNewPartner({ ...newPartner, name: e.target.value })
              }
            />
          </div>
          <div className="space-y-1">
            <label className="block font-bold text-gray-700">
              Số điện thoại
            </label>
            <input
              type="tel"
              required
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-green-500"
              value={editingPartner ? editingPartner.phone : newPartner.phone}
              onChange={(e) =>
                editingPartner
                  ? setEditingPartner({
                      ...editingPartner,
                      phone: e.target.value,
                    })
                  : setNewPartner({ ...newPartner, phone: e.target.value })
              }
            />
          </div>
          <div className="space-y-1">
            <label className="block font-bold text-gray-700">Email</label>
            <input
              type="email"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-green-500"
              value={editingPartner ? editingPartner.email : newPartner.email}
              onChange={(e) =>
                editingPartner
                  ? setEditingPartner({
                      ...editingPartner,
                      email: e.target.value,
                    })
                  : setNewPartner({ ...newPartner, email: e.target.value })
              }
            />
          </div>
          <div className="space-y-1">
            <label className="block font-bold text-gray-700">Địa chỉ</label>
            <input
              type="text"
              required
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-green-500"
              value={
                editingPartner ? editingPartner.address : newPartner.address
              }
              onChange={(e) =>
                editingPartner
                  ? setEditingPartner({
                      ...editingPartner,
                      address: e.target.value,
                    })
                  : setNewPartner({ ...newPartner, address: e.target.value })
              }
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 rounded-xl bg-green-500 font-bold text-white hover:bg-green-600 shadow-sm"
            >
              {editingPartner ? "Cập nhật" : "Thêm đối tác"}
            </button>
            {editingPartner && (
              <button
                type="button"
                onClick={() => setEditingPartner(null)}
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

export default PartnerTab;
