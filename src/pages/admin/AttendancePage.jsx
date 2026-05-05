import React, { useState } from "react";
import ScheduleTab from "./Employee/ScheduleTab";
import AttendanceHistoryTab from "./Employee/AttendanceHistoryTab";

const AttendancePage = () => {
  const [activeTab, setActiveTab] = useState("schedule");

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in font-sans text-gray-800">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-green-100">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-800 flex items-center gap-2">
            ⏰ Quản lý Chấm công
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Phân ca lịch làm việc và theo dõi dữ liệu check-in/out của nhân
            viên.
          </p>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-xl overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab("schedule")}
            className={`whitespace-nowrap px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "schedule" ? "bg-white text-green-600 shadow-sm" : "text-gray-500 hover:text-green-500"}`}
          >
            Xếp lịch làm việc
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`whitespace-nowrap px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "history" ? "bg-white text-green-600 shadow-sm" : "text-gray-500 hover:text-green-500"}`}
          >
            Dữ liệu thực tế
          </button>
        </div>
      </div>

      <div className="mt-4">
        {activeTab === "schedule" && <ScheduleTab />}

        {/* RENDER BẢNG LỊCH SỬ THAY CHO CÁI CHỮ ĐANG XÂY DỰNG HÔM QUA */}
        {activeTab === "history" && <AttendanceHistoryTab />}
      </div>
    </div>
  );
};

export default AttendancePage;
