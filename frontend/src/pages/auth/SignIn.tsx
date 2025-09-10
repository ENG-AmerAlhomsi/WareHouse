import React, { useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from "@/components/ui/card";

// Helper function to determine redirect path based on user roles
const getRedirectPath = (user: any) => {
  // Add debug logging
  console.log("SignIn - Determining redirect path for user:", user);
  
  if (!user || !user.roles || user.roles.length === 0) {
    return "/shop";
  }
  
  // Check for customer role
  if (user.roles.some((role: string) => 
    role.toLowerCase() === 'customer' || 
    role.toLowerCase().includes('customer')
  )) {
    return "/shop";
  }
  
  // Check for admin or employee roles
  if (user.roles.some((role: string) => 
    role.toLowerCase() === 'admin' || 
    role.toLowerCase().includes('admin') ||
    role.toLowerCase().includes('manager') ||
    role.toLowerCase().includes('employee')
  )) {
    return "/dashboard";
  }
  
  // Default path
  return "/shop";
};

const SignIn = () => {
  const { login, isLoading, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the intended destination if available
  const from = location.state?.from?.pathname || null;

  useEffect(() => {
    
    if (isAuthenticated && user) {
      const redirectPath = from || getRedirectPath(user);
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, user, navigate, from]);

  const handleLogin = () => {
    login();
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <img src="/warehouse.png" alt="Logo" className="h-12 w-12" />
          </div>
          <CardTitle className="text-2xl text-center">Sign in to your account</CardTitle>
          <CardDescription className="text-center">
            Click below to sign in with Keycloak
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          <Button
            onClick={handleLogin}
            className="w-full bg-wms-yellow hover:bg-wms-yellow-dark text-black"
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Sign in with Keycloak"}
          </Button>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <Link to="/signup" className="text-wms-yellow-dark hover:underline">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SignIn;
