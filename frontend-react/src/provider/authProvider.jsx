import AxiosInstance from "./axiosProvider";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const getToken = () => {
    let token = localStorage.getItem("token");
    if (token) {
      AxiosInstance.defaults.headers.common["Authorization"] = "Bearer " + token;
    }
    return token;
  }
  // State to hold the authentication token
  const [token, setToken_] = useState(getToken());

  // Function to set the authentication token
  const setToken = (newToken) => {
    setToken_(newToken);
  };

  AxiosInstance.interceptors.response.use((response) => response, (error) => {
    if (error.response.status === 401) {
      setToken("");
      localStorage.removeItem('token');
      delete AxiosInstance.defaults.headers.common["Authorization"];
      window.location = '/login';
    }
  });

  useEffect(() => {
    if (token) {
      AxiosInstance.defaults.headers.common["Authorization"] = "Bearer " + token;
      localStorage.setItem('token', token);
    } else {
      delete AxiosInstance.defaults.headers.common["Authorization"];
      localStorage.removeItem('token')
    }
  }, [token]);

  // Memoized value of the authentication context
  const contextValue = useMemo(
    () => ({
      token,
      setToken,
    }),
    [token]
  );

  // Provide the authentication context to the children components
  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};

export default AuthProvider;