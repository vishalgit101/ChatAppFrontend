import axios from "axios";

const backendUrl = import.meta.env.VITE_BACKEND_URL;
console.log(backendUrl);

// craeting axios aoi instance to attach default headers and backend url
const api = axios.create({
  baseURL: backendUrl,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Axios Response interceptor for Global Error handling due to api calls
api.interceptors.response.use(
  (response) => response, // onFullfiled
  (error) => {
    // onRejected,
    // global error handling
    if (error.response) {
      switch (error.response.status) {
        case 401: // Unauthorized
          authService.logout();
          window.location.href = "/login";
          break;
        case 403: // forbidden
          console.error("Access Forbidden");
          break;
        case 404: // No Resource found
          console.error("Resource not found");
          break;
        case 500: // Internal Server error
          console.error("Internal Server Error");
          break;
      }
    } else if (error.request) {
      console.error("Request made but didnt get the response" + error.request);
    } else {
      console.error("Something happened in the request" + error.message);
    }
    return Promise.reject(error);
  }
);

const generateUserColor = () => {
  const colors = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FFEAA7",
    "#DDA0DD",
    "#2398D8C8",
    "#F7DC6F",
    "#BB8FCE",
    "#85C1E9",
  ];

  return colors[Math.floor(Math.random() * colors.length)];
};

const login = async (username, password) => {
  try {
    const response = await api.post("/auth/login", {
      // may have to check and confirm the backend url
      username,
      password,
    });

    // After successful login
    const userColor = generateUserColor();
    const userData = {
      ...response.data,
      color: userColor,
      loginTime: new Date().toISOString(),
    };

    // set in the local storage
    localStorage.setItem("currentUser", JSON.stringify(userData));
    localStorage.setItem("user", JSON.stringify(response.data));

    return { success: true, user: userData };
  } catch (error) {
    console.error("Login Failed!", error);
    const errorMessage =
      error.response?.data?.message ||
      "Login failed, Please check your credentials";
    throw new Error(errorMessage);
  }
};

const signup = async (username, email, password) => {
  try {
    const response = await api.post("/auth/signup", {
      username,
      email,
      password,
    });
    return { success: true, user: response.data };
  } catch (error) {
    console.error("Signup Failed!", error);
    const errorMessage =
      error.response?.data?.message ||
      "Signup failed, Please check your credentials";
    throw new Error(errorMessage);
  }
};

const logout = async () => {
  try {
    const response = await api.post("/auth/logout");
  } catch (error) {
    console.error("Logout failed", error);
  } finally {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("user");
  }
};

const fetchCurrentUser = async () => {
  try {
    const response = await api.get("/auth/getcurrentuser");
    localStorage.setItem("user", JSON.stringify(response.data)); // color and login time might be wont available
    return response.data;
  } catch (error) {
    console.error("Error fetching user data", error);

    // if unauthorized
    if (error.response && error.response.status === 401) {
      await authService.logout();
    }
  }
};

const getCurrentUser = () => {
  const currentUserStr = localStorage.getItem("currentUser");
  const userStr = localStorage.getItem("user");

  try {
    if (currentUserStr) {
      return JSON.parse(currentUserStr);
    } else if (userStr) {
      const userData = JSON.parse(userStr);
      const userColor = generateUserColor();
      return { ...userData, color: userColor };
    }
    return null;
  } catch (error) {
    console.error("Error Parsing User data", error);
    return null;
  }
};

const isAuthenticated = () => {
  const user =
    localStorage.getItem("user") || localStorage.getItem("currentUser");
  return !!user; // Negates twice, so you end up with a pure boolean version of the original value:
};

const fetchPrivateMessages = async (user2) => {
  try {
    const response = await api.get(
      `/api/messages/private?user2=${encodeURIComponent(user2)}`
    );
    return response.data;
  } catch (error) {
    console.error("Error in fetching private messages", error);
    throw error;
  }
};

export const authService = {
  // dont login() or signup() etc cos these will be called immediately
  login: login,
  signup: signup,
  logout: logout,
  fetchCurrentUser: fetchCurrentUser,
  getCurrentUser: getCurrentUser,
  isAuthenticated: isAuthenticated,
  fetchPrivateMessages: fetchPrivateMessages,
};
