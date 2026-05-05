import React, { useState } from "react";
import { registerEmployee } from "../api/employeeService.js";

const CreateEmployeeForm = ({ roles = [], shops = [], onSuccess }) => {
  const [formData, setFormData] = useState({
    TenTaiKhoan: "",
    MatKhau: "",
    TenNhanVien: "",
    ChucVuId: "",
    CuaHangId: "",
    Sdt: "",
    Email: "",
    NgaySinh: "",
    GioiTinh: "",
  });

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate dữ liệu cơ bản
    if (!formData.TenTaiKhoan.trim())
      return setError("Vui lòng nhập tên tài khoản");
    if (!formData.MatKhau.trim()) return setError("Vui lòng nhập mật khẩu");
    if (!formData.TenNhanVien.trim())
      return setError("Vui lòng nhập tên nhân viên");
    if (!formData.ChucVuId) return setError("Vui lòng chọn chức vụ");
    if (!formData.CuaHangId) return setError("Vui lòng chọn cửa hàng");
    if (!formData.Sdt.trim()) return setError("Vui lòng nhập số điện thoại");
    if (!formData.Email.trim()) return setError("Vui lòng nhập email");
    if (!formData.NgaySinh) return setError("Vui lòng chọn ngày sinh");
    if (!formData.GioiTinh) return setError("Vui lòng chọn giới tính");

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const dataToSend = {
        ...formData,
        ChucVuId: parseInt(formData.ChucVuId),
        CuaHangId: parseInt(formData.CuaHangId),
        GioiTinh: formData.GioiTinh === "true",
        AvatarUpload: avatarFile,
      };

      const response = await registerEmployee(dataToSend);

      setSuccess(
        response?.Message ||
          response?.message ||
          "Tạo tài khoản nhân viên thành công!",
      );
      setFormData({
        TenTaiKhoan: "",
        MatKhau: "",
        TenNhanVien: "",
        ChucVuId: "",
        CuaHangId: "",
        Sdt: "",
        Email: "",
        NgaySinh: "",
        GioiTinh: "",
      });
      setAvatarFile(null);
      setAvatarPreview(null);
      if (onSuccess) onSuccess(response.data);
    } catch (err) {
      console.error("Error creating employee:", err);

      // FIX 2: Bóc tách chính xác lỗi Validation 400 từ Backend C#
      let errorMsg = "Lỗi khi tạo tài khoản nhân viên";

      if (err?.response?.data) {
        const data = err.response.data;
        if (typeof data === "string") {
          errorMsg = data;
        } else if (data.errors) {
          // Lấy dòng báo lỗi đầu tiên của C# (VD: "Mật khẩu phải có ít nhất 8 kí tự")
          const firstKey = Object.keys(data.errors)[0];
          errorMsg = data.errors[firstKey][0];
        } else if (data.message) {
          errorMsg = data.message;
        }
      }

      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full animate-fade-in">
      <div className="bg-white border border-green-100 rounded-2xl p-6 lg:p-8 shadow-sm relative overflow-hidden">
        {/* Decorate góc */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-bl-full -z-0 opacity-50" />

        <h2 className="text-xl font-extrabold text-gray-800 mb-6 relative z-10 flex items-center gap-2">
          <span className="text-green-500">✨</span> Tạo tài khoản nhân sự
        </h2>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-semibold flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-semibold flex items-center gap-2">
            <span>✅</span> {success}
          </div>
        )}

        <div className="relative z-10">
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Ảnh đại diện
            </label>
            <div className="flex items-center gap-4">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Preview"
                  className="w-16 h-16 rounded-full object-cover border-2 border-green-200 shadow-sm"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center border-2 border-dashed border-green-200">
                  <span className="text-green-300 text-xl">📷</span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 transition cursor-pointer"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Tên tài khoản <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="TenTaiKhoan"
                value={formData.TenTaiKhoan}
                onChange={handleInputChange}
                placeholder="VD: nhancong2026"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:ring-2 focus:ring-green-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Tên nhân viên <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="TenNhanVien"
                value={formData.TenNhanVien}
                onChange={handleInputChange}
                placeholder="VD: Nguyễn Văn A"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:ring-2 focus:ring-green-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Mật khẩu <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="MatKhau"
                value={formData.MatKhau}
                onChange={handleInputChange}
                placeholder="Nhập mật khẩu"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:ring-2 focus:ring-green-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="Email"
                value={formData.Email}
                onChange={handleInputChange}
                placeholder="VD: abc@domain.com"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:ring-2 focus:ring-green-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Số điện thoại <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="Sdt"
                value={formData.Sdt}
                onChange={handleInputChange}
                placeholder="VD: 0912345678"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:ring-2 focus:ring-green-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Ngày sinh <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="NgaySinh"
                value={formData.NgaySinh}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:ring-2 focus:ring-green-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Giới tính <span className="text-red-500">*</span>
              </label>
              <select
                name="GioiTinh"
                value={formData.GioiTinh}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:ring-2 focus:ring-green-500 focus:outline-none"
              >
                <option value="">Chọn giới tính</option>
                <option value="true">Nam</option>
                <option value="false">Nữ</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Chức vụ <span className="text-red-500">*</span>
              </label>
              <select
                name="ChucVuId"
                value={formData.ChucVuId}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:ring-2 focus:ring-green-500 focus:outline-none"
              >
                <option value="">Chọn chức vụ</option>

                {/* FIX 3: Dự phòng cả trường hợp Backend trả về 'id' thay vì 'chucVuId' */}
                {roles.map((role, idx) => (
                  <option
                    key={role.chucVuId || role.id || idx}
                    value={role.chucVuId || role.id}
                  >
                    {role.chucVuName || role.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Cửa hàng <span className="text-red-500">*</span>
              </label>
              <select
                name="CuaHangId"
                value={formData.CuaHangId}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:ring-2 focus:ring-green-500 focus:outline-none"
              >
                <option value="">Chọn cửa hàng</option>

                {/* FIX 3: Dự phòng cả trường hợp Backend trả về 'id' thay vì 'cuaHangId' */}
                {shops.map((shop, idx) => (
                  <option
                    key={shop.cuaHangId || shop.shopId || shop.id || idx}
                    value={shop.cuaHangId || shop.shopId || shop.id}
                  >
                    {shop.shopName || shop.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-green-500 text-white rounded-xl font-bold shadow-md shadow-green-500/30 hover:bg-green-600 disabled:opacity-50 transition transform hover:-translate-y-0.5"
            >
              {loading ? "Đang xử lý..." : "Tạo tài khoản"}
            </button>
            <button
              type="reset"
              onClick={() => {
                setAvatarFile(null);
                setAvatarPreview(null);
              }}
              className="px-8 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition"
            >
              Làm mới
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default CreateEmployeeForm;
