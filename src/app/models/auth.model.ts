// POST /api/auth/login — Request
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  userName: string;
  permissions: string[];
}

// POST /api/auth/refresh-token — Request
export interface RefreshTokenRequest {
  refreshToken: string;
}
