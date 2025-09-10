/* eslint-disable @typescript-eslint/no-explicit-any */
// Helper functions for checking user roles

// Function to check if user has specific role
export const hasRole = (user: any, role: string): boolean => {
  if (!user?.roles) return false;
  
  // Special handling for 'customer' role
  if (role.toLowerCase() === 'customer') {
    return user.roles.some((r: string) => 
      r.toLowerCase() === 'customer' ||
      r.toLowerCase().includes('customer')
    );
  }
  
  // Special handling for 'admin' role
  if (role.toLowerCase() === 'admin') {
    return user.roles.some((r: string) => 
      r.toLowerCase() === 'admin' ||
      r.toLowerCase().includes('admin')
    );
  }

  // General case - exact match
  return user.roles.includes(role);
};

// Function to check if user has any of the specified roles
export const hasAnyRole = (user: any, roles: string[]): boolean => {
  if (!user?.roles) return false;
  return roles.some(role => hasRole(user, role));
};

// Function to check if user is admin
export const isAdmin = (user: any): boolean => {
  return hasRole(user, 'admin');
}; 