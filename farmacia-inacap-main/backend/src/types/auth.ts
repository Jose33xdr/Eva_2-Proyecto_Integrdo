export type JwtUserPayload = {
  sub: string;
  username: string;
  role: string;
  permissions: string[];
};
