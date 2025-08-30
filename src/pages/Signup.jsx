import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authServive } from "../services/authService";
const Signup = () => {
  // definie states, varibales and functions
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsLoading(true);

    try {
      const result = await authServive.signup(username, email, password);
      if (result.success) {
        setMessage("Account Created Successfully! Please login");
        setTimeout(() => {
          navigate("/login");
        }, 2000); // auto redirects to login after 2sec
      }
    } catch (error) {
      setMessage(error.message || "Signup failed please try again");
      console.error("Signup Failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-box">
        <div className="signup-header">
          <h1>Signup</h1>
          <p>Create an account to start chatting</p>
        </div>
        <form onSubmit={handleSignup} className="signup-form">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="username-input"
            maxLength={200}
            required
            disabled={isLoading}
          />

          <input
            type="text"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="username-input"
            maxLength={50}
            required
            disabled={isLoading}
          />

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
            disabled={
              !username.trim() || !email.trim() || !password.trim() || isLoading
            }
            className="join-btn"
          >
            {isLoading ? "Creating account..." : "Signup"}
          </button>

          {message && (
            <p
              className="auth-message"
              style={{
                color: message.includes("Successfully") ? "#4CaF50" : "#ff6b6b",
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

export default Signup;
