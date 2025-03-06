
import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const Logout = () => {
  const { signOut } = useAuth();

  useEffect(() => {
    const performLogout = async () => {
      await signOut();
    };
    
    performLogout();
  }, [signOut]);

  return <Navigate to="/" replace />;
};

export default Logout;
