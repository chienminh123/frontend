import React, { useState } from "react";
import PartnerTab from "./PartnerTab";
import InventoryTab from "./InventoryTab";

const SupplierPage = () => {
  const [activeTab, setActiveTab] = useState("partners");

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in font-sans text-gray-800">
      {/* HEADER & THANH ĐIỀU HƯỚNG TABS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-green-100">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-800 flex items-center gap-2">
            🏭 Sản xuất & Kho
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý nhà cung cấp đối tác và theo dõi số lượng tồn kho nguyên
            liệu.
          </p>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-xl overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab("partners")}
            className={`whitespace-nowrap px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "partners" ? "bg-white text-green-600 shadow-sm" : "text-gray-500 hover:text-green-500"}`}
          >
            Quản lý Đối tác
          </button>
          <button
            onClick={() => setActiveTab("kho")}
            className={`whitespace-nowrap px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "kho" ? "bg-white text-green-600 shadow-sm" : "text-gray-500 hover:text-green-500"}`}
          >
            Quản lý Kho
          </button>
        </div>
      </div>

      {/* RENDER COMPONENT TƯƠNG ỨNG VỚI TAB */}
      <div className="mt-4">
        {activeTab === "partners" && <PartnerTab />}
        {activeTab === "kho" && <InventoryTab />}
      </div>
    </div>
  );
};

export default SupplierPage;
