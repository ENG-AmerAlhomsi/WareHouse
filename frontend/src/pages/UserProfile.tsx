import React, { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  CardDescription
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, 
  Key, 
  LogOut, 
  Shield,
  BadgeInfo
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

// System roles that should be hidden from the UI
const HIDDEN_SYSTEM_ROLES = [
  'offline_access',
  'default-roles-warehouse-dev',
  'uma_authorization'
];

const UserProfile = () => {
  const { user, logout, forgotPassword } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const navigate = useNavigate();

  // Filter out system roles for display
  const displayRoles = useMemo(() => {
    if (!user?.roles) return [];
    return user.roles.filter(role => !HIDDEN_SYSTEM_ROLES.includes(role));
  }, [user?.roles]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleResetPassword = async () => {
    try {
      if (user?.email) {
        await forgotPassword(user.email);
      } else {
        toast.error("Email address not available");
      }
    } catch (error) {
      toast.error("Failed to initiate password reset");
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Please sign in to view your profile</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-1">User Profile</h1>
        <p className="text-muted-foreground">
          View your account information
        </p>
      </div>

      <div className="flex flex-col items-center space-y-2 mb-4">
        <div className="w-28 h-28 rounded-full bg-gray-200 flex items-center justify-center">
          <User className="h-16 w-16 text-gray-500" />
        </div>
        <h2 className="text-xl font-semibold mt-2">{user.firstName} {user.lastName}</h2>
        <div className="flex flex-wrap gap-2 justify-center">
          {displayRoles.map((role, index) => (
            <span 
              key={index} 
              className="px-3 py-1 bg-wms-yellow text-black text-sm rounded-full flex items-center"
            >
              <Shield className="h-3 w-3 mr-1" />
              {role}
            </span>
          ))}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="profile">Profile Information</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>User Information</CardTitle>
              <CardDescription>Your personal information from Keycloak</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">First Name</h3>
                  <p className="text-base font-medium">{user.firstName || 'Not provided'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Last Name</h3>
                  <p className="text-base font-medium">{user.lastName || 'Not provided'}</p>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Email</h3>
                <p className="text-base font-medium">{user.email || 'Not provided'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Username</h3>
                <p className="text-base font-medium">{user.username || 'Not provided'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">User ID</h3>
                <p className="text-base font-medium">{user.id || 'Not provided'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Roles</h3>
                <div className="flex flex-wrap gap-2 mt-1">
                  {displayRoles && displayRoles.length > 0 ? 
                    displayRoles.map((role, index) => (
                      <span 
                        key={index} 
                        className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-md"
                      >
                        {role}
                      </span>
                    )) : 
                    <p className="text-sm text-muted-foreground">No roles assigned</p>
                  }
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <p className="text-sm text-muted-foreground">
                To update your profile information, please contact your administrator
              </p>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your account security</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col space-y-2">
                <h3 className="text-sm font-medium">Password Management</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Reset your password through Keycloak's secure password reset flow
                </p>
                <Button 
                  variant="outline" 
                  className="flex items-center" 
                  onClick={handleResetPassword}
                >
                  <Key className="h-4 w-4 mr-2" />
                  Reset Password
                </Button>
              </div>
              
              <div className="flex flex-col space-y-2">
                <h3 className="text-sm font-medium">Account Actions</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Sign out from all sessions
                </p>
                <Button 
                  variant="destructive" 
                  className="flex items-center w-fit" 
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </CardContent>
            <CardFooter>
              <p className="text-sm text-muted-foreground">
                For other security concerns, please contact your administrator
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserProfile;
