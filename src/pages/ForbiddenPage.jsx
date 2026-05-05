const ForbiddenPage = () => (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="bg-slate-800 px-8 py-6 rounded-xl text-center text-slate-100">
        <h1 className="text-2xl font-semibold mb-2">403 - Không có quyền truy cập</h1>
        <p className="text-sm text-slate-300">
          Tài khoản của bạn không đủ quyền để truy cập chức năng này.
        </p>
      </div>
    </div>
  );
  
  export default ForbiddenPage;