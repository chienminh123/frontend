import axiosClient from "./axiosClient";

/**
 * Dịch vụ quản lý nhân viên - sử dụng Axios để gọi API từ backend
 */

/**
 * Tạo tài khoản nhân viên mới (chỉ Admin và HR)
 * @param {Object} employeeData - Dữ liệu nhân viên cần tạo
 * @param {string} employeeData.TenTaiKhoan - Tên tài khoản đăng nhập
 * @param {string} employeeData.MatKhau - Mật khẩu
 * @param {string} employeeData.TenNhanVien - Tên nhân viên
 * @param {number} employeeData.ChucVuId - ID chức vụ
 * @param {number} employeeData.CuaHangId - ID cửa hàng
 * @param {string} employeeData.Sdt - Số điện thoại
 * @param {string} employeeData.Email - Email
 * @param {string} employeeData.NgaySinh - Ngày sinh (format: YYYY-MM-DD)
 * @param {string} employeeData.GioiTinh - Giới tính (M/F/Other)
 * @param {File} employeeData.AvatarUpload - File ảnh đại diện (optional)
 * @returns {Promise} Response từ API
 */
export const registerEmployee = async (employeeData) => {
  try {
    const formData = new FormData();

    // Thêm các field cơ bản vào FormData
    formData.append("TenTaiKhoan", employeeData.TenTaiKhoan);
    formData.append("MatKhau", employeeData.MatKhau);
    formData.append("TenNhanVien", employeeData.TenNhanVien);
    formData.append("ChucVuId", employeeData.ChucVuId);
    formData.append("CuaHangId", employeeData.CuaHangId);
    formData.append("Sdt", employeeData.Sdt);
    formData.append("Email", employeeData.Email);
    formData.append("NgaySinh", employeeData.NgaySinh);
    formData.append("GioiTinh", employeeData.GioiTinh);

    // Thêm file ảnh nếu có
    if (employeeData.AvatarUpload) {
      formData.append("AvatarUpload", employeeData.AvatarUpload);
    }

    const response = await axiosClient.post("/admin/auth/register", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Lấy danh sách tất cả nhân viên
 * @returns {Promise<Array>} Danh sách nhân viên
 */
export const getEmployees = async () => {
  try {
    const response = await axiosClient.get("/admin/Employee");
    return Array.isArray(response.data)
      ? response.data
      : response.data.data || [];
  } catch (error) {
    throw error;
  }
};

/**
 * Lấy thông tin chi tiết một nhân viên
 * @param {number} employeeId - ID nhân viên
 * @returns {Promise<Object>} Thông tin nhân viên
 */
export const getEmployeeById = async (employeeId) => {
  try {
    const response = await axiosClient.get(`/admin/Employee/${employeeId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Cập nhật thông tin nhân viên
 * @param {number} employeeId - ID nhân viên
 * @param {Object} employeeData - Dữ liệu cần cập nhật
 * @returns {Promise} Response từ API
 */
export const updateEmployee = async (employeeId, employeeData) => {
  try {
    const formData = new FormData();

    // Thêm các field vào FormData
    Object.keys(employeeData).forEach((key) => {
      if (employeeData[key] !== null && employeeData[key] !== undefined) {
        formData.append(key, employeeData[key]);
      }
    });

    const response = await axiosClient.put(
      `/admin/Employee/${employeeId}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Xóa nhân viên
 * @param {number} employeeId - ID nhân viên
 * @returns {Promise} Response từ API
 */
export const deleteEmployee = async (employeeId) => {
  try {
    const response = await axiosClient.delete(`/admin/Employee/${employeeId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Tìm kiếm nhân viên
 * @param {Object} params - Tham số tìm kiếm
 * @param {string} params.keyword - Từ khóa tìm kiếm
 * @param {string} params.searchType - Loại tìm kiếm (name|phone|email|role)
 * @returns {Promise<Array>} Kết quả tìm kiếm
 */
export const searchEmployees = async (params) => {
  try {
    const response = await axiosClient.get("/admin/Employee/search", {
      params,
    });
    return Array.isArray(response.data)
      ? response.data
      : response.data.data || [];
  } catch (error) {
    throw error;
  }
};
