// components/withAuth.js
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const withAuth = (WrappedComponent) => {
  return function AuthenticatedComponent(props) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
      const token = sessionStorage.getItem("token");

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        setIsAuthenticated(true);
      } catch (error) {
        sessionStorage.removeItem("token");
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    }, [router]);

    if (isLoading || !isAuthenticated) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };
};

export default withAuth;
