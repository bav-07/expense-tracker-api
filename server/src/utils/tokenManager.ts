// Simple in-memory blacklist for demo (use Redis in production)
class TokenBlacklistManager {
  private blacklistedTokens: Set<string> = new Set();
  private tokenExpiration: Map<string, number> = new Map();

  /**
   * Add token to blacklist
   */
  blacklistToken(token: string, expiresAt: number): void {
    this.blacklistedTokens.add(token);
    this.tokenExpiration.set(token, expiresAt);
    
    // Clean up expired tokens periodically
    this.cleanupExpiredTokens();
  }

  /**
   * Check if token is blacklisted
   */
  isTokenBlacklisted(token: string): boolean {
    return this.blacklistedTokens.has(token);
  }

  /**
   * Clean up expired tokens from blacklist
   */
  private cleanupExpiredTokens(): void {
    const now = Date.now();
    for (const [token, expiresAt] of this.tokenExpiration.entries()) {
      if (expiresAt < now) {
        this.blacklistedTokens.delete(token);
        this.tokenExpiration.delete(token);
      }
    }
  }

  /**
   * Clear all tokens (for testing)
   */
  clear(): void {
    this.blacklistedTokens.clear();
    this.tokenExpiration.clear();
  }
}

// Singleton instance
export const tokenBlacklist = new TokenBlacklistManager();

// Refresh token storage (use Redis in production)
class RefreshTokenManager {
  private refreshTokens: Map<string, { userId: string, expiresAt: number }> = new Map();

  /**
   * Store refresh token
   */
  storeRefreshToken(token: string, userId: string, expiresAt: number): void {
    this.refreshTokens.set(token, { userId, expiresAt });
    this.cleanupExpiredTokens();
  }

  /**
   * Validate and get user ID from refresh token
   */
  validateRefreshToken(token: string): string | null {
    const tokenData = this.refreshTokens.get(token);
    if (!tokenData) return null;
    
    if (tokenData.expiresAt < Date.now()) {
      this.refreshTokens.delete(token);
      return null;
    }
    
    return tokenData.userId;
  }

  /**
   * Remove refresh token
   */
  revokeRefreshToken(token: string): void {
    this.refreshTokens.delete(token);
  }

  /**
   * Clean up expired refresh tokens
   */
  private cleanupExpiredTokens(): void {
    const now = Date.now();
    for (const [token, data] of this.refreshTokens.entries()) {
      if (data.expiresAt < now) {
        this.refreshTokens.delete(token);
      }
    }
  }

  /**
   * Clear all refresh tokens (for testing)
   */
  clear(): void {
    this.refreshTokens.clear();
  }
}

// Singleton instance
export const refreshTokenManager = new RefreshTokenManager();