import React, { useState } from "react";
import PayrollTab from "./PayrollTab"; // Import Tab Bảng lương chúng ta vừa làm

const AccountingPage = () => {
  const [activeTab, setActiveTab] = useState("payroll");

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in font-sans text-gray-800">
      {/* HEADER & THANH ĐIỀU HƯỚNG TABS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-green-100">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-800 flex items-center gap-2">
            💰 Kế toán & Tài chính
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý bảng lương nhân viên, hóa đơn bán hàng và báo cáo doanh thu.
          </p>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-xl overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab("payroll")}
            className={`whitespace-nowrap px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "payroll" ? "bg-white text-green-600 shadow-sm" : "text-gray-500 hover:text-green-500"}`}
          >
            Bảng lương
          </button>
          <button
            onClick={() => setActiveTab("invoices")}
            className={`whitespace-nowrap px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "invoices" ? "bg-white text-green-600 shadow-sm" : "text-gray-500 hover:text-green-500"}`}
          >
            Hóa đơn
          </button>
          <button
            onClick={() => setActiveTab("reports")}
            className={`whitespace-nowrap px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "reports" ? "bg-white text-green-600 shadow-sm" : "text-gray-500 hover:text-green-500"}`}
          >
            Báo cáo doanh thu
          </button>
        </div>
      </div>

      {/* RENDER COMPONENT TƯƠNG ỨNG VỚI TAB */}
      <div className="mt-4">
        {activeTab === "payroll" && <PayrollTab />}

        {/* Khung chờ cho phần Hóa Đơn */}
        {activeTab === "invoices" && (
          <div className="bg-white p-10 text-center rounded-2xl shadow-sm border border-gray-100">
            <span className="text-5xl text-gray-300">🧾</span>
            <h3 className="text-lg font-bold text-gray-700 mt-4">
              Quản lý Hóa Đơn
            </h3>
            <p className="mt-2 text-gray-500 font-medium">
              Phân hệ đồng bộ hóa đơn từ máy POS đang được xây dựng...
            </p>
          </div>
        )}

        {/* Khung chờ cho phần Báo Cáo */}
        {activeTab === "reports" && (
          <div className="bg-white p-10 text-center rounded-2xl shadow-sm border border-gray-100">
            <span className="text-5xl text-gray-300">📈</span>
            <h3 className="text-lg font-bold text-gray-700 mt-4">
              Báo cáo Doanh Thu
            </h3>
            <p className="mt-2 text-gray-500 font-medium">
              Hệ thống biểu đồ phân tích lợi nhuận đang được xây dựng...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountingPage;
