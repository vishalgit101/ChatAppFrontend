import { authService as result } from "../services/authService.js";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = result.isAuthenticated();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  } else {
    return children; // chidren is ChatArea
  }
};

export default ProtectedRoute;
