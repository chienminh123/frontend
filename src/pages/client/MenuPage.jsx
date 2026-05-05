import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import productApi from "../../api/productApi";

const MenuPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // States cho bộ lọc
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [priceRange, setPriceRange] = useState(100000); // Giá tối đa

  // States cho Popup Chọn Size
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const list = await productApi.getMenuClient();
        if (!alive) return;
        setProducts(list); // list đã được group ở backend
      } catch (e) {
        if (!alive) return;
        setError(
          e?.response?.data?.message ||
            e?.message ||
            "Không thể tải danh sách sản phẩm.",
        );
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    };
    load();
    return () => {
      alive = false;
    };
  }, []);

  const categories = useMemo(() => {
    const set = new Set();
    for (const p of products) {
      const c = (p.tenTheLoai || "").trim();
      if (c) set.add(c);
    }
    return ["Tất cả", ...Array.from(set)];
  }, [products]);

  // Logic lọc sản phẩm theo tên thể loại và giá bán từ
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCategory =
        selectedCategory === "Tất cả" || p.tenTheLoai === selectedCategory;
      const matchPrice = Number(p.giaBanTu || 0) <= priceRange;
      return matchCategory && matchPrice;
    });
  }, [selectedCategory, priceRange, products]);

  const formatVnd = (value) => `${Number(value || 0).toLocaleString("vi-VN")}₫`;

  // Mở Popup chọn size
  const handleOpenModal = (product) => {
    setSelectedProduct(product);
    setSelectedOption(product.options[0]); // Mặc định size rẻ nhất
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 animate-fade-in relative">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-green-50 border border-green-100 text-green-700 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest">
          Thực đơn hôm nay
        </div>
        <h2 className="text-3xl md:text-4xl font-black text-gray-800 tracking-tight mt-4">
          Chọn món <span className="text-green-600">dinh dưỡng</span> phù hợp
        </h2>
        <p className="text-gray-500 mt-2">
          Lọc món ăn theo sở thích và ngân sách của bạn
        </p>
      </div>

      {/* Thanh bộ lọc */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-green-100 mb-10 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex flex-col w-full md:w-auto">
          <label className="text-xs font-black text-green-600 uppercase mb-2 ml-1">
            Chọn loại cháo
          </label>
          <select
            className="bg-gray-50 border-none rounded-2xl px-5 py-3 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-green-500 outline-none transition cursor-pointer"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === "Tất cả" ? "Tất cả thực đơn" : c}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col w-full md:w-1/3">
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-black text-green-600 uppercase ml-1">
              Khoảng giá
            </label>
            <span className="text-sm font-black text-gray-800 bg-yellow-100 px-3 py-1 rounded-full">
              Dưới {priceRange.toLocaleString()}₫
            </span>
          </div>
          <input
            type="range"
            min="20000"
            max="150000"
            step="5000"
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-500"
            value={priceRange}
            onChange={(e) => setPriceRange(parseInt(e.target.value))}
          />
          <div className="flex justify-between text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-widest">
            <span>20k</span>
            <span>150k</span>
          </div>
        </div>
        <div className="hidden md:block text-right text-gray-400 font-medium">
          Tìm thấy{" "}
          <span className="text-green-600 font-black">
            {filteredProducts.length}
          </span>{" "}
          món
        </div>
      </div>

      {loading && (
        <div className="bg-white p-10 rounded-[3rem] border border-green-50 text-center shadow-sm">
          <div className="text-5xl mb-3 animate-pulse">🥣</div>
          <p className="font-black text-gray-800">Đang tải sản phẩm...</p>
        </div>
      )}

      {!loading && error && (
        <div className="bg-white p-10 rounded-[3rem] border border-red-100 text-center shadow-sm">
          <div className="text-5xl mb-3">⚠️</div>
          <p className="font-black text-red-600">{error}</p>
        </div>
      )}

      {/* Danh sách món ăn */}
      {!loading && !error && filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredProducts.map((item, idx) => (
            <div
              key={idx}
              className="group bg-white rounded-[2.5rem] border border-green-50 p-5 shadow-sm hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 flex flex-col justify-between"
            >
              <div>
                <div
                  className="aspect-square bg-green-50 rounded-[2rem] mb-5 overflow-hidden relative cursor-pointer"
                  onClick={() => handleOpenModal(item)}
                >
                  {item.hinhAnh ? (
                    <img
                      src={item.hinhAnh}
                      alt={item.sanPhamName}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src =
                          "https://via.placeholder.com/560x560?text=No+Image";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-7xl">
                      🥣
                    </div>
                  )}
                  <div className="absolute inset-0 bg-yellow-400/0 group-hover:bg-yellow-400/10 transition duration-500"></div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-gray-400 uppercase italic bg-gray-50 px-2 py-1 rounded-md">
                      {item.tenTheLoai || "-"}
                    </span>
                  </div>
                  <Link
                    to={`/product/${encodeURIComponent(item.sanPhamName)}`}
                    className="block font-black text-gray-800 text-lg leading-tight hover:text-green-600 transition-colors line-clamp-2"
                  >
                    {item.sanPhamName}
                  </Link>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {item.moTa || "Mô tả chưa có."}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-50">
                <div>
                  <span className="text-gray-400 text-xs">Từ </span>
                  <span className="text-green-600 font-black text-xl italic">
                    {formatVnd(item.giaBanTu)}
                  </span>
                </div>
                <Link
                  to={`/product/${encodeURIComponent(item.sanPhamName)}`}
                  className="bg-yellow-400 hover:bg-yellow-500 text-yellow-900 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-400/20 transition-all active:scale-90"
                >
                  <span className="text-2xl font-bold">+</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        !loading &&
        !error && (
          <div className="py-20 text-center bg-white rounded-[3rem] border border-dashed border-gray-200">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-black text-gray-800">
              Không tìm thấy món phù hợp
            </h3>
            <button
              onClick={() => {
                setSelectedCategory("Tất cả");
                setPriceRange(100000);
              }}
              className="mt-6 text-green-600 font-black hover:underline"
            >
              Đặt lại tất cả bộ lọc
            </button>
          </div>
        )
      )}

      {/* POPUP CHỌN SIZE */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-[2rem] p-6 max-w-sm w-full shadow-2xl relative">
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 w-8 h-8 bg-gray-100 rounded-full font-bold text-gray-500 hover:bg-gray-200"
            >
              X
            </button>
            <div className="flex gap-4 items-center border-b border-gray-100 pb-4 mb-4">
              <img
                src={selectedProduct.hinhAnh}
                className="w-20 h-20 rounded-2xl object-cover"
                alt="img"
                onError={(e) => {
                  e.currentTarget.src = "https://via.placeholder.com/150";
                }}
              />
              <div>
                <h3 className="font-black text-lg text-gray-800 leading-tight">
                  {selectedProduct.sanPhamName}
                </h3>
                <p className="text-green-600 font-black text-xl mt-1">
                  {formatVnd(selectedOption?.giaBan)}
                </p>
              </div>
            </div>
            <p className="text-sm font-bold text-gray-600 mb-2">Chọn Size:</p>
            <div className="flex flex-col gap-2 mb-6">
              {selectedProduct.options.map((opt) => (
                <button
                  key={opt.sanPhamId}
                  onClick={() => setSelectedOption(opt)}
                  className={`flex justify-between px-4 py-3 rounded-xl border-2 font-bold transition-all ${selectedOption?.sanPhamId === opt.sanPhamId ? "border-green-500 bg-green-50 text-green-700" : "border-gray-100 text-gray-600 hover:border-green-200"}`}
                >
                  <span>Size {opt.size}</span>
                  <span>{formatVnd(opt.giaBan)}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                alert(
                  `Đã thêm ${selectedProduct.sanPhamName} (Size ${selectedOption.size}) vào giỏ hàng!`,
                );
                setSelectedProduct(null); // Đóng popup
              }}
              className="w-full py-4 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-black rounded-2xl transition shadow-lg shadow-yellow-400/30"
            >
              Thêm vào giỏ ({formatVnd(selectedOption?.giaBan)})
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuPage;
