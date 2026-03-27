import { Navigate } from "react-router-dom";

export default function AdminRoute({ children }) {
  const token = localStorage.getItem("accessToken");
  const rawUser = localStorage.getItem("authUser");

  if (!token || !rawUser) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(rawUser);
    if (user?.role !== "admin") {
      return (
        <Navigate
          to="/dashboard"
          replace
          state={{
            adminAccessDenied: true,
            message: "Only the admin account can access the admin dashboard.",
          }}
        />
      );
    }
  } catch (_error) {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("authUser");
    return <Navigate to="/login" replace />;
  }

  return children;
}
