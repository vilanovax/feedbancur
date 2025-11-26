import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      mobile: string;
      email?: string;
      name: string;
      role: string;
      departmentId: string | null;
      mustChangePassword?: boolean;
    };
  }

  interface User {
    id: string;
    mobile: string;
    email?: string;
    name: string;
    role: string;
    departmentId: string | null;
    mustChangePassword?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    mobile: string;
    role: string;
    departmentId: string | null;
    mustChangePassword?: boolean;
  }
}

