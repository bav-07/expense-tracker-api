import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Request } from 'express';
import { redisTokenManager } from './redisTokenManager';
import JWTSecurityManager from './jwtSecurity';

interface ClientFingerprint {
  ip: string;
  userAgent: string;
  fingerprintHash: string;
}

interface BoundTokenPayload {
  id: string;
  jti: string; // JWT Token ID
  fingerprint: string; // Client fingerprint hash
  iat?: number;
  exp?: number;
}

interface TokenBinding {
  jti: string;
  userId: string;
  fingerprint: string;
  ip: string;
  userAgent: string;
  createdAt: number;
  expiresAt: number;
  tokenType: 'access' | 'refresh';
}

export class TokenBindingService {
  private static readonly FINGERPRINT_ALGORITHM = 'sha256';
  
  /**
   * Creates a client fingerprint from request headers and IP
   */
  static createClientFingerprint(req: Request): ClientFingerprint {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    
    // Create a hash of IP + User-Agent for fingerprinting
    const fingerprintData = `${ip}:${userAgent}`;
    const fingerprintHash = crypto
      .createHash(this.FINGERPRINT_ALGORITHM)
      .update(fingerprintData)
      .digest('hex');
    
    return {
      ip,
      userAgent,
      fingerprintHash
    };
  }

  /**
   * Generates a unique JWT ID (jti)
   */
  static generateJti(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Creates a bound access token with client fingerprint
   */
  static async createBoundAccessToken(
    userId: string, 
    req: Request
  ): Promise<{ token: string; jti: string }> {
    const fingerprint = this.createClientFingerprint(req);
    const jti = this.generateJti();
    const jwtConfig = JWTSecurityManager.getJWTConfig();
    
    const payload: BoundTokenPayload = {
      id: userId,
      jti,
      fingerprint: fingerprint.fingerprintHash
    };
    
    const token = jwt.sign(payload, jwtConfig.secret, {
      expiresIn: jwtConfig.expiresIn as jwt.SignOptions['expiresIn'],
      issuer: 'expense-tracker-api',
      audience: 'expense-tracker-app'
    });
    
    // Store token binding information
    const binding: TokenBinding = {
      jti,
      userId,
      fingerprint: fingerprint.fingerprintHash,
      ip: fingerprint.ip,
      userAgent: fingerprint.userAgent,
      createdAt: Date.now(),
      expiresAt: Date.now() + (60 * 60 * 1000), // 1 hour
      tokenType: 'access'
    };
    
    await this.storeTokenBinding(binding);
    
    return { token, jti };
  }

  /**
   * Creates a bound refresh token with client fingerprint
   */
  static async createBoundRefreshToken(
    userId: string, 
    req: Request
  ): Promise<{ token: string; jti: string }> {
    const fingerprint = this.createClientFingerprint(req);
    const jti = this.generateJti();
    const jwtConfig = JWTSecurityManager.getJWTConfig();
    
    const payload: BoundTokenPayload = {
      id: userId,
      jti,
      fingerprint: fingerprint.fingerprintHash
    };
    
    const token = jwt.sign(payload, jwtConfig.secret, {
      expiresIn: jwtConfig.refreshExpiresIn as jwt.SignOptions['expiresIn'],
      issuer: 'expense-tracker-api',
      audience: 'expense-tracker-app'
    });
    
    // Store token binding information
    const binding: TokenBinding = {
      jti,
      userId,
      fingerprint: fingerprint.fingerprintHash,
      ip: fingerprint.ip,
      userAgent: fingerprint.userAgent,
      createdAt: Date.now(),
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
      tokenType: 'refresh'
    };
    
    await this.storeTokenBinding(binding);
    
    return { token, jti };
  }

  /**
   * Validates a bound token against current client context
   */
  static async validateBoundToken(
    token: string, 
    req: Request
  ): Promise<{ isValid: boolean; payload?: BoundTokenPayload; reason?: string }> {
    try {
      const jwtConfig = JWTSecurityManager.getJWTConfig();
      const payload = jwt.verify(token, jwtConfig.secret) as BoundTokenPayload;
      
      if (!payload.jti || !payload.fingerprint) {
        return { isValid: false, reason: 'Token missing binding information' };
      }
      
      // Get stored token binding
      const binding = await this.getTokenBinding(payload.jti);
      if (!binding) {
        return { isValid: false, reason: 'Token binding not found' };
      }
      
      // Check if token is expired or revoked
      if (Date.now() > binding.expiresAt) {
        await this.revokeTokenBinding(payload.jti);
        return { isValid: false, reason: 'Token binding expired' };
      }
      
      // Validate client fingerprint
      const currentFingerprint = this.createClientFingerprint(req);
      if (currentFingerprint.fingerprintHash !== binding.fingerprint) {
        // Log suspicious activity
        console.warn('Token binding validation failed:', {
          jti: payload.jti,
          expectedFingerprint: binding.fingerprint,
          actualFingerprint: currentFingerprint.fingerprintHash,
          expectedIP: binding.ip,
          actualIP: currentFingerprint.ip,
          expectedUserAgent: binding.userAgent,
          actualUserAgent: currentFingerprint.userAgent
        });
        
        return { isValid: false, reason: 'Client fingerprint mismatch' };
      }
      
      return { isValid: true, payload };
      
    } catch (error) {
      return { isValid: false, reason: `Token validation error: ${error}` };
    }
  }

  /**
   * Stores token binding information in Redis
   */
  private static async storeTokenBinding(binding: TokenBinding): Promise<void> {
    const key = `token_binding:${binding.jti}`;
    const ttl = Math.ceil((binding.expiresAt - Date.now()) / 1000); // TTL in seconds
    
    await redisTokenManager.set(key, JSON.stringify(binding), ttl);
  }

  /**
   * Retrieves token binding information from Redis
   */
  private static async getTokenBinding(jti: string): Promise<TokenBinding | null> {
    const key = `token_binding:${jti}`;
    const data = await redisTokenManager.get(key);
    
    if (!data) {
      return null;
    }
    
    try {
      return JSON.parse(data) as TokenBinding;
    } catch (error) {
      console.error('Failed to parse token binding data:', error);
      return null;
    }
  }

  /**
   * Revokes a token binding (invalidates the token)
   */
  static async revokeTokenBinding(jti: string): Promise<void> {
    const key = `token_binding:${jti}`;
    await redisTokenManager.delete(key);
  }

  /**
   * Revokes all tokens for a specific user (useful for logout all devices)
   */
  static async revokeAllUserTokens(userId: string): Promise<void> {
    // This would require scanning Redis for all tokens belonging to the user
    // For now, we'll implement a simpler approach using a user token registry
    const userTokensKey = `user_tokens:${userId}`;
    const tokenList = await redisTokenManager.get(userTokensKey);
    
    if (tokenList) {
      try {
        const tokens = JSON.parse(tokenList) as string[];
        for (const jti of tokens) {
          await this.revokeTokenBinding(jti);
        }
        await redisTokenManager.delete(userTokensKey);
      } catch (error) {
        console.error('Failed to revoke user tokens:', error);
      }
    }
  }

  /**
   * Adds a token to the user's token registry
   */
  static async addTokenToUserRegistry(userId: string, jti: string): Promise<void> {
    const userTokensKey = `user_tokens:${userId}`;
    const tokenList = await redisTokenManager.get(userTokensKey);
    
    let tokens: string[] = [];
    if (tokenList) {
      try {
        tokens = JSON.parse(tokenList) as string[];
      } catch (error) {
        console.error('Failed to parse user token list:', error);
      }
    }
    
    tokens.push(jti);
    
    // Store with 7 day TTL (longest possible token lifetime)
    await redisTokenManager.set(userTokensKey, JSON.stringify(tokens), 7 * 24 * 60 * 60);
  }

  /**
   * Gets security information about client fingerprint changes
   */
  static async getClientSecurityInfo(userId: string): Promise<{
    activeTokens: number;
    recentFingerprints: Array<{ ip: string; userAgent: string; lastSeen: number }>;
  }> {
    const userTokensKey = `user_tokens:${userId}`;
    const tokenList = await redisTokenManager.get(userTokensKey);
    
    const securityInfo = {
      activeTokens: 0,
      recentFingerprints: [] as Array<{ ip: string; userAgent: string; lastSeen: number }>
    };
    
    if (tokenList) {
      try {
        const tokens = JSON.parse(tokenList) as string[];
        const fingerprints = new Map<string, { ip: string; userAgent: string; lastSeen: number }>();
        
        for (const jti of tokens) {
          const binding = await this.getTokenBinding(jti);
          if (binding && Date.now() < binding.expiresAt) {
            securityInfo.activeTokens++;
            
            const fpKey = `${binding.ip}:${binding.userAgent}`;
            const existing = fingerprints.get(fpKey);
            if (!existing || binding.createdAt > existing.lastSeen) {
              fingerprints.set(fpKey, {
                ip: binding.ip,
                userAgent: binding.userAgent,
                lastSeen: binding.createdAt
              });
            }
          }
        }
        
        securityInfo.recentFingerprints = Array.from(fingerprints.values())
          .sort((a, b) => b.lastSeen - a.lastSeen)
          .slice(0, 10); // Last 10 unique fingerprints
          
      } catch (error) {
        console.error('Failed to get client security info:', error);
      }
    }
    
    return securityInfo;
  }
}