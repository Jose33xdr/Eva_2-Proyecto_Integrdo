export type PermissionValue =
  | string
  | {
      code: string;
      name?: string;
    };

export type AuthRole =
  | string
  | {
      code: string;
      name: string;
    };

export type AuthUser = {
  id: string;
  rut: string;
  firstName: string;
  lastName: string;
  email: string | null;
  username: string;
  role: AuthRole;
  permissions?: PermissionValue[];
};

export type LoginResponse = {
  ok: boolean;
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};
