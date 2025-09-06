import "./App.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Navbar from "./components/Navbar";
import MainPage from "./pages/MainPage";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import PrivateChat from "./pages/PrivateChat";
import Chat from "./pages/ChatArea";
import ProtectedRoute from "./components/ProtectedRoute";
function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/chatarea"
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

//import Browser Router

// add element for each path

// to go to the chat area user should be authenticated first: So we'll enclose /chatarea with <Protected Route>

// control will first come to the ProtectedRoute and it will check if the user is authenticated or not

// if authenticated go forward and if not redirects to login

// React Router replaces the current entry in the history stack.
//Meaning the user cannot go back to the previous invalid route using the Back button.
