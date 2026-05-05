import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// Layout
import AdminLayout from "./layouts/AdminLayout";
import ClientLayout from "./layouts/ClientLayout"; // nếu chưa có thì tạm comment
import ProtectedRoute from "./components/ProtectedRoute";

// Pages
import AdminLogin from "./pages/admin/AdminLogin";
import IposLogin from "./pages/ipos/IposLogin";
import ClientAuth from "./pages/client/ClientAuth";
import OtpVerification from "./pages/client/OtpVerification";
import ForbiddenPage from "./pages/ForbiddenPage";

// Ví dụ các trang admin con
import DashboardPage from "./pages/admin/DashboardPage";
import SupplierPage from "./pages/admin/production/SupplierPage";
import EmployeePage from "./pages/admin/EmployeePage";
import ShopPage from "./pages/admin/ShopPage";
import AccountingPage from "./pages/admin/AccountingPage";
import AttendancePage from "./pages/admin/AttendancePage";

// Chấm công nhân viên (Mobile)
import EmployeeLogin from "./pages/admin/Employee/EmployeeLogin";
import CheckInPage from "./pages/admin/Employee/CheckInPage";

// Ví dụ trang chủ khách hàng
import HomePage from "./pages/client/HomePage";
import MenuPage from "./pages/client/MenuPage";
import AccountPage from "./pages/client/AccountPage";
import PointsPage from "./pages/client/PointsPage";
import OrderHistoryPage from "./pages/client/OrderHistoryPage";
import ProductDetailPage from "./pages/client/ProductDetailPage";
import CartPage from "./pages/client/CartPage";
import CheckoutPage from "./pages/client/CheckoutPage";
import VnPayReturnPage from "./pages/client/VnPayReturnPage";

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" reverseOrder={false} />

      <Routes>
        {/* ADMIN: login */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/403" element={<ForbiddenPage />} />

        {/* ========================================================= */}
        {/* CHẤM CÔNG NHÂN VIÊN (Dùng trên Mobile, nằm ngoài lớp bảo vệ Admin) */}
        <Route path="/employee/login" element={<EmployeeLogin />} />
        <Route path="/check-in" element={<CheckInPage />} />
        {/* ========================================================= */}

        {/* ADMIN: các route bảo vệ */}
        <Route
          element={
            <ProtectedRoute
              allowedRoles={[
                "Admin",
                "HR",
                "Accountant",
                "Sales",
                "POS",
                "Production",
                "StoreManager",
                "AreaManager",
              ]}
            />
          }
        >
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="employees" element={<EmployeePage />} />
            <Route path="shops" element={<ShopPage />} />
            <Route path="accounting" element={<AccountingPage />} />
            <Route path="suppliers" element={<SupplierPage />} />
            <Route path="attendance" element={<AttendancePage />} />
          </Route>
        </Route>

        {/* IPOS */}
        <Route path="/ipos/login" element={<IposLogin />} />

        {/* KHÁCH HÀNG */}
        <Route path="/" element={<ClientLayout />}>
          <Route path="/otp-verification" element={<OtpVerification />} />
          <Route path="/login" element={<ClientAuth />} />
          <Route index element={<HomePage />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/account/points" element={<PointsPage />} />
          <Route path="/account/my-orders" element={<OrderHistoryPage />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/vnpay-return" element={<VnPayReturnPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
