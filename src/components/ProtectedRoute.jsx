import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { getCurrentUser } from "../utils/auth";

const ProtectedRoute = ({ allowedRoles }) => {
  const user = getCurrentUser();
  console.log("USER FROM TOKEN = ", user);
  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/403" replace />;
  }

  return <Outlet context={{ user }} />;
};

export default ProtectedRoute;