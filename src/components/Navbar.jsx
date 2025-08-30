import { Link, Navigate } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService.js";
function Navbar() {
  // define states, variables and functions
  const navigate = useNavigate();
  const isAuthenticated = authService.isAuthenticated();
  const currentUser = authService.getCurrentUser();

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate("/login");
    } catch (error) {
      console.error(error);
      localStorage.clear();
      navigate("/login");
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          Chat Application
        </Link>
      </div>

      <div className="navbar-menu">
        {isAuthenticated ? (
          <>
            <Link to="/chatarea" className="navbar-link">
              Chat Area
            </Link>
            <Link to="/aboutpage" className="navbar-link">
              About Page
            </Link>
            <div className="navbar-user">
              <span className="user-info">Welcome, {currentUser.username}</span>
              <button className="logout-btn" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </>
        ) : (
          <>
            <Link to="/login" className="navbar-link">
              Login
            </Link>
            <Link to="/signup" className="navbar-link">
              Signup
            </Link>
            <Link to="/aboutpage" className="navbar-link">
              About Page
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
