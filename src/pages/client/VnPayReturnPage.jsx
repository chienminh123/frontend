import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import axiosClient from "../../api/axiosClient"; // Nhớ import axios của bạn

const VnPayReturnPage = () => {
  const [searchParams] = useSearchParams();
  const vnp_ResponseCode = searchParams.get("vnp_ResponseCode");
  const [isUpdating, setIsUpdating] = useState(true);

  useEffect(() => {
    const updateOrderStatus = async () => {
      try {
        // Nếu thanh toán thành công (Mã 00), gọi C# để cập nhật DB
        if (vnp_ResponseCode === "00") {
          // Bắn toàn bộ chuỗi URL của VNPAY về cho C#
          await axiosClient.get(
            `/client/order/vnpay-return-update${window.location.search}`,
          );
        }
      } catch (error) {
        console.error("Lỗi cập nhật trạng thái:", error);
      } finally {
        setIsUpdating(false); // Xong thì tắt loading
      }
    };

    updateOrderStatus();
  }, [vnp_ResponseCode]);

  if (isUpdating) {
    return (
      <div className="text-center py-20 font-bold text-gray-500">
        Đang đồng bộ giao dịch...
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-20 text-center">
      {vnp_ResponseCode === "00" ? (
        <>
          <h1 className="text-4xl text-green-500 font-black mb-4">
            🎉 Thanh toán thành công!
          </h1>
          <p className="text-gray-600 mb-8">
            Hệ thống đã xác nhận thanh toán. Cửa hàng đang chuẩn bị món ăn cho
            bạn nhé.
          </p>
        </>
      ) : (
        <>
          <h1 className="text-4xl text-red-500 font-black mb-4">
            ❌ Thanh toán thất bại!
          </h1>
          <p className="text-gray-600 mb-8">
            Đã có lỗi xảy ra hoặc bạn đã hủy giao dịch.
          </p>
        </>
      )}
      <Link
        to="/account/orders"
        className="bg-green-500 text-white px-6 py-3 rounded-xl font-bold"
      >
        Xem đơn hàng của tôi
      </Link>
    </div>
  );
};

export default VnPayReturnPage;
