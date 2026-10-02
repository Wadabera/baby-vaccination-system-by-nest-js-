import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { homeFor } from "../utils/navigation";

/**
 * Gate a route behind authentication and, optionally, a set of roles.
 * Renders `null` while the session is being restored so the UI does not flash
 * the login page before we know who the user is.
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (
    allowedRoles &&
    allowedRoles.length > 0 &&
    !allowedRoles.includes(user.role)
  ) {
    // Signed in but lacking permission: send them to their own home, not a
    // dead end.
    return <Navigate to={homeFor(user.role)} replace />;
  }

  return children;
};

export default ProtectedRoute;
