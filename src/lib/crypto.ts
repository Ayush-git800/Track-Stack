export * from "./crypto.mjs";

export interface RotatingTokenPayload {
  sessionId: string;
  clubId: string;
  clubDayId: string;
  otp: string;
  exp: number;
  issuedAt: number;
  salt: string;
}

export interface VerificationResult {
  valid: boolean;
  error?: string;
  payload?: RotatingTokenPayload;
}
