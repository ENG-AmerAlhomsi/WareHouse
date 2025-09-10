
export interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  roles: string[];
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}
