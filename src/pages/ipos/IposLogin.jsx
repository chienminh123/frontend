import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";

const IposLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // Vẫn gọi API Admin Auth vì nhân viên cũng là nội bộ
      const res = await axiosClient.post("/admin/auth/login", {
        TenTaiKhoan: username,
        MatKhau: password,
      });

      // Chỉ cho phép nhân viên bán hàng
      const role = res.data.role;
      if (role !== "Nhân viên bán hàng" && role !== "Quản lý cửa hàng") {
        alert("Tài khoản này không phải nhân viên bán hàng!");
        return;
      }

      localStorage.setItem("token", res.data.token);
      navigate("/ipos/sales"); // Vào màn hình bán hàng
    } catch (err) {
      alert("Sai mã nhân viên hoặc mật khẩu!");
    }
  };

  return (
    <div
      style={{
        height: "100vh",
        background: "#ecf0f1",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <h1 style={{ color: "#d35400", fontSize: "3rem" }}>IPOS BÁN HÀNG</h1>
      <form onSubmit={handleLogin} style={{ width: 400 }}>
        <input
          style={{ width: "100%", padding: 20, fontSize: 20, marginBottom: 10 }}
          placeholder="Tài khoản NV"
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          style={{ width: "100%", padding: 20, fontSize: 20, marginBottom: 20 }}
          type="password"
          placeholder="Mật khẩu"
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          type="submit"
          style={{
            width: "100%",
            padding: 20,
            fontSize: 20,
            background: "#d35400",
            color: "white",
            border: "none",
            cursor: "pointer",
          }}
        >
          VÀO CA
        </button>
      </form>
    </div>
  );
};
export default IposLogin;
