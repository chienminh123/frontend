// import React, { useState, useEffect, useMemo } from "react";
// import axios from "axios";
// import { QRCodeCanvas } from "qrcode.react"; // Nhớ chạy: npm install qrcode.react

// // --- SETUP API Y HỆT DASHBOARD CŨ ---
// const api = axios.create({
//   baseURL: "/api",
//   headers: { Accept: "application/json" },
// });

// const getAdminToken = () =>
//   window.localStorage.getItem("adminToken") ||
//   window.localStorage.getItem("token") ||
//   "";

// api.interceptors.request.use((config) => {
//   const token = getAdminToken();
//   if (token) config.headers.Authorization = `Bearer ${token}`;
//   return config;
// });

// const getCoordinatesFromAddress = async (address, city) => {
//   try {
//     const query = `${address}, ${city}, Việt Nam`;
//     const res = await fetch(
//       `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`,
//     );
//     const data = await res.json();
//     if (data && data.length > 0) {
//       return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
//     }
//     return null;
//   } catch (error) {
//     console.error("Lỗi lấy tọa độ:", error);
//     return null;
//   }
// };

// const ShopPage = () => {
//   // 1. CÁC STATE QUẢN LÝ DỮ LIỆU
//   const [shops, setShops] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   const [searchShopKey, setSearchShopKey] = useState("");

//   const [newShop, setNewShop] = useState({
//     name: "",
//     phone: "",
//     address: "",
//     city: "",
//     latitude: null,
//     longitude: null,
//     allowedRadius: 50,
//   });

//   const [editingShop, setEditingShop] = useState(null);

//   // State quản lý QR Modal
//   const [showQrModal, setShowQrModal] = useState(null);

//   const authHeaders = useMemo(() => {
//     const token = getAdminToken();
//     return token ? { Authorization: `Bearer ${token}` } : {};
//   }, []);

//   const handleApiError = (e) => {
//     console.error(e);
//     const msg =
//       e?.response?.data?.message ||
//       e?.response?.data ||
//       e.message ||
//       "Có lỗi xảy ra, vui lòng thử lại";
//     setError(typeof msg === "string" ? msg : "Có lỗi xảy ra, vui lòng thử lại");
//     alert(typeof msg === "string" ? msg : "Có lỗi xảy ra, vui lòng thử lại");
//   };

//   // 2. LOAD DỮ LIỆU BAN ĐẦU
//   useEffect(() => {
//     const fetchShops = async () => {
//       try {
//         setLoading(true);
//         const res = await api.get("/admin/ShopInfo", { headers: authHeaders });
//         const data = res.data;
//         if (Array.isArray(data)) setShops(data);
//         else if (data && typeof data === "object")
//           setShops(data.data || data.shops || []);
//       } catch (err) {
//         handleApiError(err);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchShops();
//   }, [authHeaders]);

//   // 3. LOGIC XỬ LÝ: TÌM KIẾM, TẠO, SỬA, XÓA (Giữ nguyên nghiệp vụ)
//   const handleSearchShop = async (key) => {
//     try {
//       setLoading(true);
//       const url = key
//         ? `/admin/ShopInfo/search-by-name?key=${encodeURIComponent(key)}`
//         : "/admin/ShopInfo";
//       const res = await api.get(url, { headers: authHeaders });
//       const data = res.data;
//       if (Array.isArray(data)) setShops(data);
//       else if (data && typeof data === "object")
//         setShops(data.data || data.shops || []);
//     } catch (err) {
//       handleApiError(err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleFetchCoords = async () => {
//     if (!newShop.address) return;
//     const coords = await getCoordinatesFromAddress(
//       newShop.address,
//       newShop.city,
//     );
//     if (coords) {
//       setNewShop((prev) => ({
//         ...prev,
//         latitude: coords.lat,
//         longitude: coords.lon,
//       }));
//       alert("Đã tìm thấy tọa độ!");
//     } else {
//       alert("Không tìm thấy địa chỉ này trên bản đồ");
//     }
//   };

//   const handleFetchCoordsEdit = async () => {
//     if (!editingShop.address) return;
//     const coords = await getCoordinatesFromAddress(
//       editingShop.address,
//       editingShop.city,
//     );
//     if (coords) {
//       setEditingShop((prev) => ({
//         ...prev,
//         latitude: coords.lat,
//         longitude: coords.lon,
//       }));
//       alert("Đã tìm thấy tọa độ!");
//     } else {
//       alert("Không tìm thấy địa chỉ này trên bản đồ");
//     }
//   };

//   const handleCreateShop = async (e) => {
//     e.preventDefault();
//     try {
//       setLoading(true);
//       setError("");
//       const coords = await getCoordinatesFromAddress(
//         newShop.address,
//         newShop.city,
//       );
//       const form = new FormData();
//       form.append("name", newShop.name);
//       form.append("phone", newShop.phone);
//       form.append("address", newShop.address);
//       form.append("city", newShop.city);
//       if (coords) {
//         form.append("latitude", coords.lat);
//         form.append("longitude", coords.lon);
//       } else {
//         if (newShop.latitude) form.append("latitude", newShop.latitude);
//         if (newShop.longitude) form.append("longitude", newShop.longitude);
//       }
//       form.append("BanKinhChoPhep", newShop.allowedRadius || 50);

//       await api.post("/admin/ShopInfo", form, { headers: authHeaders });
//       await handleSearchShop(searchShopKey);
//       setNewShop({
//         name: "",
//         phone: "",
//         address: "",
//         city: "",
//         latitude: null,
//         longitude: null,
//         allowedRadius: 50,
//       });
//       alert(
//         coords
//           ? "Tạo thành công (Đã xác định tọa độ)!"
//           : "Tạo thành công (Chưa lấy được tọa độ)!",
//       );
//     } catch (err) {
//       handleApiError(err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleEditShop = (shop) => {
//     setEditingShop({
//       id: shop.cuaHangId || shop.shopId || shop.id,
//       name: shop.shopName || "",
//       phone: shop.shopPhone || "",
//       address: shop.shopAddress || "",
//       city: shop.shopCity || "",
//       latitude: shop.latitude || null,
//       longitude: shop.longitude || null,
//       allowedRadius: shop.banKinhChoPhep || 50,
//     });
//   };

//   const handleUpdateShop = async (e) => {
//     e.preventDefault();
//     if (!editingShop) return;
//     try {
//       setLoading(true);
//       setError("");
//       const coords = await getCoordinatesFromAddress(
//         editingShop.address,
//         editingShop.city,
//       );
//       const body = {
//         name: editingShop.name,
//         phone: editingShop.phone,
//         address: editingShop.address,
//         city: editingShop.city,
//         latitude: coords ? coords.lat : editingShop.latitude,
//         longitude: coords ? coords.lon : editingShop.longitude,
//         banKinhChoPhep: editingShop.allowedRadius || 50,
//       };

//       await api.put(`/admin/ShopInfo/shop-update/${editingShop.id}`, body, {
//         headers: { ...authHeaders, "Content-Type": "application/json" },
//       });
//       await handleSearchShop(searchShopKey);
//       setEditingShop(null);
//       alert("Cập nhật thành công!");
//     } catch (err) {
//       handleApiError(err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleDeleteShop = async (id) => {
//     if (!window.confirm("Bạn có chắc muốn xóa cửa hàng này?")) return;
//     try {
//       setLoading(true);
//       setError("");
//       await api.delete(`/admin/ShopInfo?id=${id}`, { headers: authHeaders });
//       await handleSearchShop(searchShopKey);
//     } catch (err) {
//       handleApiError(err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleDownloadQR = () => {
//     const canvas = document.querySelector("#qr-code-canvas canvas");
//     if (!canvas) return;
//     const pngUrl = canvas
//       .toDataURL("image/png")
//       .replace("image/png", "image/octet-stream");
//     const downloadLink = document.createElement("a");
//     downloadLink.href = pngUrl;
//     downloadLink.download = `Ma_QR_${showQrModal?.shopName || "CuaHang"}.png`;
//     document.body.appendChild(downloadLink);
//     downloadLink.click();
//     document.body.removeChild(downloadLink);
//   };

//   // 4. GIAO DIỆN CHÍNH
//   return (
//     <div className="space-y-6 max-w-7xl mx-auto animate-fade-in font-sans text-gray-800">
//       {/* Header */}
//       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-green-100">
//         <div>
//           <h2 className="text-2xl font-extrabold text-gray-800 flex items-center gap-2">
//             🏪 Quản lý cửa hàng
//           </h2>
//           <p className="text-sm text-gray-500 mt-1">
//             Hệ thống danh sách chi nhánh và định vị điểm danh.
//           </p>
//         </div>
//         {loading && (
//           <span className="text-sm text-green-500 font-bold animate-pulse">
//             Đang xử lý...
//           </span>
//         )}
//       </div>

//       <div className="grid gap-6 lg:grid-cols-[1.3fr,1fr]">
//         {/* BẢNG DANH SÁCH BÊN TRÁI */}
//         <section className="space-y-4">
//           <div className="mb-4">
//             <input
//               type="text"
//               placeholder="Tìm theo tên cửa hàng..."
//               className="w-full max-w-md bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
//               value={searchShopKey}
//               onChange={(e) => {
//                 setSearchShopKey(e.target.value);
//                 handleSearchShop(e.target.value);
//               }}
//             />
//           </div>
//           <div className="rounded-2xl bg-white border border-green-100 overflow-hidden shadow-sm">
//             <div className="overflow-x-auto text-sm">
//               <table className="min-w-full text-left">
//                 <thead className="text-xs uppercase font-bold text-green-700 bg-green-50 border-b border-green-100">
//                   <tr>
//                     <th className="py-3 px-4">Tên cửa hàng</th>
//                     <th className="py-3 px-4">SĐT</th>
//                     <th className="py-3 px-4">Địa chỉ / Vị trí</th>
//                     <th className="py-3 px-4 text-right">Hành động</th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-gray-100">
//                   {shops.map((s, index) => (
//                     <tr
//                       key={s.cuaHangId || s.shopId || s.id || `shop-${index}`}
//                       className="hover:bg-gray-50 transition"
//                     >
//                       <td className="py-4 px-4 text-gray-800 font-bold">
//                         {s.shopName}
//                       </td>
//                       <td className="py-4 px-4 text-gray-600 font-medium">
//                         {s.shopPhone}
//                       </td>
//                       <td className="py-4 px-4">
//                         <p className="text-gray-800">
//                           {s.shopAddress}, {s.shopCity}
//                         </p>
//                         {s.latitude ? (
//                           <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100 mt-1 inline-block">
//                             📍 Đã có tọa độ
//                           </span>
//                         ) : (
//                           <span className="text-[10px] bg-red-50 text-red-500 px-2 py-0.5 rounded border border-red-100 mt-1 inline-block">
//                             ⚠️ Chưa có tọa độ
//                           </span>
//                         )}
//                       </td>
//                       <td className="py-4 px-4 text-right flex justify-end gap-3">
//                         <button
//                           className="text-green-600 font-bold hover:underline"
//                           onClick={() => setShowQrModal(s)}
//                         >
//                           In QR
//                         </button>
//                         <button
//                           className="text-blue-500 hover:underline"
//                           onClick={() => handleEditShop(s)}
//                         >
//                           Sửa
//                         </button>
//                         <button
//                           className="text-red-500 hover:underline"
//                           onClick={() =>
//                             handleDeleteShop(s.cuaHangId || s.shopId || s.id)
//                           }
//                         >
//                           Xóa
//                         </button>
//                       </td>
//                     </tr>
//                   ))}
//                   {shops.length === 0 && (
//                     <tr>
//                       <td
//                         colSpan={4}
//                         className="py-6 text-center text-gray-500"
//                       >
//                         Không có cửa hàng phù hợp.
//                       </td>
//                     </tr>
//                   )}
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         </section>

//         {/* FORM THÊM / SỬA BÊN PHẢI */}
//         <section className="rounded-2xl bg-white border border-green-100 p-6 shadow-sm h-fit">
//           <h3 className="text-lg font-bold text-gray-800 mb-5">
//             {editingShop ? "✏️ Chỉnh sửa cửa hàng" : "✨ Thêm cửa hàng mới"}
//           </h3>
//           <form
//             className="space-y-4 text-sm"
//             onSubmit={editingShop ? handleUpdateShop : handleCreateShop}
//           >
//             <div className="space-y-1">
//               <label className="block font-bold text-gray-700">
//                 Tên cửa hàng
//               </label>
//               <input
//                 type="text"
//                 required
//                 className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-green-500"
//                 value={editingShop ? editingShop.name : newShop.name}
//                 onChange={(e) =>
//                   editingShop
//                     ? setEditingShop({ ...editingShop, name: e.target.value })
//                     : setNewShop({ ...newShop, name: e.target.value })
//                 }
//               />
//             </div>
//             <div className="space-y-1">
//               <label className="block font-bold text-gray-700">
//                 Số điện thoại
//               </label>
//               <input
//                 type="tel"
//                 required
//                 className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-green-500"
//                 value={editingShop ? editingShop.phone : newShop.phone}
//                 onChange={(e) =>
//                   editingShop
//                     ? setEditingShop({ ...editingShop, phone: e.target.value })
//                     : setNewShop({ ...newShop, phone: e.target.value })
//                 }
//               />
//             </div>
//             <div className="space-y-1">
//               <label className="block font-bold text-gray-700">Địa chỉ</label>
//               <input
//                 type="text"
//                 required
//                 className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-green-500"
//                 value={editingShop ? editingShop.address : newShop.address}
//                 onChange={(e) =>
//                   editingShop
//                     ? setEditingShop({
//                         ...editingShop,
//                         address: e.target.value,
//                       })
//                     : setNewShop({ ...newShop, address: e.target.value })
//                 }
//               />
//             </div>
//             <div className="space-y-1">
//               <label className="block font-bold text-gray-700">Thành phố</label>
//               <input
//                 type="text"
//                 required
//                 className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-green-500"
//                 value={editingShop ? editingShop.city : newShop.city}
//                 onChange={(e) =>
//                   editingShop
//                     ? setEditingShop({ ...editingShop, city: e.target.value })
//                     : setNewShop({ ...newShop, city: e.target.value })
//                 }
//               />
//             </div>

//             {/* PHẦN GPS */}
//             <div className="grid grid-cols-2 gap-4 mt-6 p-4 bg-green-50 rounded-2xl border border-dashed border-green-200">
//               <div className="col-span-2 flex justify-between items-center">
//                 <span className="text-sm font-bold text-green-800">
//                   📍 Tọa độ GPS
//                 </span>
//                 <button
//                   type="button"
//                   onClick={
//                     editingShop ? handleFetchCoordsEdit : handleFetchCoords
//                   }
//                   className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 shadow-sm"
//                 >
//                   Lấy từ địa chỉ
//                 </button>
//               </div>
//               <div>
//                 <label className="block text-[11px] uppercase font-bold text-gray-400 mb-1">
//                   Vĩ độ (Lat)
//                 </label>
//                 <input
//                   readOnly
//                   value={
//                     editingShop
//                       ? editingShop.latitude || ""
//                       : newShop.latitude || ""
//                   }
//                   className="w-full bg-white border border-gray-200 p-2 rounded-xl text-blue-600 font-mono"
//                 />
//               </div>
//               <div>
//                 <label className="block text-[11px] uppercase font-bold text-gray-400 mb-1">
//                   Kinh độ (Lng)
//                 </label>
//                 <input
//                   readOnly
//                   value={
//                     editingShop
//                       ? editingShop.longitude || ""
//                       : newShop.longitude || ""
//                   }
//                   className="w-full bg-white border border-gray-200 p-2 rounded-xl text-blue-600 font-mono"
//                 />
//               </div>
//               <div className="col-span-2 mt-2">
//                 <label className="block font-bold text-gray-700 mb-1">
//                   Bán kính chấm công (mét)
//                 </label>
//                 <input
//                   type="number"
//                   className="w-32 border border-gray-200 p-2 rounded-xl focus:ring-2 focus:ring-green-500"
//                   value={
//                     editingShop
//                       ? editingShop.allowedRadius
//                       : newShop.allowedRadius
//                   }
//                   onChange={(e) =>
//                     editingShop
//                       ? setEditingShop({
//                           ...editingShop,
//                           allowedRadius: parseInt(e.target.value) || 0,
//                         })
//                       : setNewShop({
//                           ...newShop,
//                           allowedRadius: parseInt(e.target.value) || 0,
//                         })
//                   }
//                 />
//               </div>
//             </div>

//             <div className="flex gap-2 pt-2">
//               <button
//                 type="submit"
//                 disabled={loading}
//                 className="flex-1 px-4 py-3 rounded-xl bg-green-500 font-bold text-white hover:bg-green-600 shadow-sm"
//               >
//                 {editingShop ? "Lưu Cập Nhật" : "Tạo Cửa Hàng"}
//               </button>
//               {editingShop && (
//                 <button
//                   type="button"
//                   onClick={() => setEditingShop(null)}
//                   className="flex-1 px-4 py-3 rounded-xl bg-gray-200 font-bold text-gray-700 hover:bg-gray-300"
//                 >
//                   Hủy
//                 </button>
//               )}
//             </div>
//           </form>
//         </section>
//       </div>

//       {/* MODAL IN QR CODE */}
//       {showQrModal && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-fade-in">
//           <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative flex flex-col items-center">
//             <button
//               onClick={() => setShowQrModal(null)}
//               className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-gray-500 hover:bg-gray-800"
//             >
//               ✕
//             </button>
//             <h3 className="text-xl font-black text-gray-800 mb-1">
//               Mã QR Chấm Công
//             </h3>
//             <p className="text-green-600 font-bold mb-6 text-center text-lg uppercase">
//               {showQrModal.shopName}
//             </p>
//             <div
//               id="qr-code-canvas"
//               className="p-4 bg-white border-4 border-green-500 rounded-2xl shadow-sm"
//             >
//               <QRCodeCanvas
//                 value={JSON.stringify({
//                   shopId:
//                     showQrModal.cuaHangId ||
//                     showQrModal.shopId ||
//                     showQrModal.id,
//                 })}
//                 size={220}
//                 level={"H"}
//                 includeMargin={true}
//               />
//             </div>
//             <p className="text-sm text-gray-500 text-center mt-5">
//               In mã này và dán tại quầy để nhân viên quét điểm danh.
//             </p>
//             <button
//               onClick={handleDownloadQR}
//               className="mt-6 w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3.5 rounded-xl shadow-lg"
//             >
//               Tải ảnh QR về máy
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default ShopPage;
import React, { useState } from "react";
// Import 3 Component con vừa tạo ở trên
import ShopTab from "./ShopTab";
import ProductTab from "./ProductTab";
import DiscountTab from "./DiscountTab";

const ShopPage = () => {
  // Quản lý việc Tab nào đang được mở
  const [activeTab, setActiveTab] = useState("shops");

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in font-sans text-gray-800">
      {/* HEADER & THANH ĐIỀU HƯỚNG TABS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-green-100">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-800 flex items-center gap-2">
            🏪 Vận hành kinh doanh
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý chi nhánh, danh sách món ăn và các chương trình khuyến mãi.
          </p>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-xl overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab("shops")}
            className={`whitespace-nowrap px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "shops" ? "bg-white text-green-600 shadow-sm" : "text-gray-500 hover:text-green-500"}`}
          >
            Cửa hàng
          </button>
          <button
            onClick={() => setActiveTab("products")}
            className={`whitespace-nowrap px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "products" ? "bg-white text-green-600 shadow-sm" : "text-gray-500 hover:text-green-500"}`}
          >
            Sản phẩm
          </button>
          <button
            onClick={() => setActiveTab("discounts")}
            className={`whitespace-nowrap px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "discounts" ? "bg-white text-green-600 shadow-sm" : "text-gray-500 hover:text-green-500"}`}
          >
            Khuyến mãi
          </button>
        </div>
      </div>

      {/* RENDER COMPONENT TƯƠNG ỨNG VỚI TAB */}
      <div className="mt-4">
        {activeTab === "shops" && <ShopTab />}
        {activeTab === "products" && <ProductTab />}
        {activeTab === "discounts" && <DiscountTab />}
      </div>
    </div>
  );
};

export default ShopPage;
