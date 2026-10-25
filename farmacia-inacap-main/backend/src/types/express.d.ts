import type { JwtUserPayload } from "./auth.js";

declare global {
  namespace Express {
    interface Request {
      auth?: JwtUserPayload;
    }
  }
}

export {};
