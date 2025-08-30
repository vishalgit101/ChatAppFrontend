import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authServive } from "../services/authService";
const Login = () => {
  // definie states, varibales and functions
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  //const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsLoading(true);

    try {
      const result = await authServive.Login(username, password); // we are using email as username for our app
      if (result.success) {
        setMessage("Login Successful");
        setTimeout(() => {
          navigate("/chatarea");
        }, 2000); // auto redirects to login after 2sec
      }
    } catch (error) {
      setMessage(error.message || "Login failed please try again");
      console.error("Login Failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h1>Login</h1>
          <p>Create an account to start chatting</p>
        </div>
        <form onSubmit={handleLogin} className="login-form">
          <input
            type="text"
            placeholder="Email"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="username-input"
            maxLength={200}
            required
            disabled={isLoading}
          />

          {/*<input
            type="text"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="username-input"
            maxLength={50}
            required
            disabled={isLoading}
          />*/}

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="user-input"
            maxLength={50}
            required
            disabled={isLoading}
          />

          <button
            type="submit"
            disabled={!username.trim() || !password.trim() || isLoading}
            className="login-btn"
          >
            {isLoading ? "Logging In..." : "Login"}
          </button>

          {message && (
            <p
              className="auth-message"
              style={{
                color: message.includes("Successful") ? "#4CaF50" : "#ff6b6b",
              }}
            >
              {message}
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default Login;
