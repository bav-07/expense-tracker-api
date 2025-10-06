import Redis from 'ioredis';
import crypto from 'crypto';

interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  lazyConnect: boolean;
  connectTimeout: number;
  commandTimeout: number;
  maxRetriesPerRequest: number;
  enableReadyCheck: boolean;
  tls?: {
    rejectUnauthorized: boolean;
  };
}

class RedisTokenManager {
  private redis: Redis | null;
  private fallbackEnabled: boolean = true;
  private fallbackStorage: Map<string, { value: string; expiresAt: number }> = new Map();

  constructor() {
    // Only initialize Redis in production
    if (process.env.NODE_ENV === 'production' && process.env.REDIS_HOST) {
      this.redis = this.initializeRedis();
    } else {
      console.log('Development mode: Using memory storage for tokens');
      this.fallbackEnabled = true;
      this.redis = null;
    }
  }

  private initializeRedis(): Redis {
    const redisConfig: RedisConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      lazyConnect: true,
      connectTimeout: 5000,
      commandTimeout: 3000,
      maxRetriesPerRequest: 1,
      enableReadyCheck: false,
    };

    // Enable TLS for production Redis Cloud instances
    if (process.env.NODE_ENV === 'production' && process.env.REDIS_HOST?.includes('redis-cloud.com')) {
      redisConfig.tls = {
        // Don't reject unauthorized certificates for Redis Cloud
        rejectUnauthorized: false,
      };
    }

    // Support for Redis connection URL (alternative to individual settings)
    if (process.env.REDIS_URL) {
      return new Redis(process.env.REDIS_URL, {
        lazyConnect: true,
        connectTimeout: 5000,
        commandTimeout: 3000,
        maxRetriesPerRequest: 1,
        enableReadyCheck: false,
        // Enable TLS for Redis Cloud URLs
        tls: process.env.REDIS_URL.includes('redis-cloud.com') ? { rejectUnauthorized: false } : undefined,
      });
    }

    const redis = new Redis(redisConfig);

    redis.on('error', (err) => {
      console.error('Redis connection error:', err);
      this.fallbackEnabled = true;
      if (process.env.NODE_ENV === 'production') {
        // In production, Redis failure is critical
        throw new Error('Redis connection required for production');
      }
    });

    redis.on('connect', () => {
      console.log('Connected to Redis');
      this.fallbackEnabled = false;
    });

    redis.on('close', () => {
      console.warn('Redis connection closed, falling back to memory storage');
      this.fallbackEnabled = true;
    });

    // Try to connect, but don't block if Redis is not available
    redis.connect().catch(() => {
      console.log('Redis not available, using memory storage');
      this.fallbackEnabled = true;
    });

    return redis;
  }

  /**
   * Blacklist an access token
   */
  async blacklistToken(token: string, expiresAt: number): Promise<void> {
    const key = `blacklist:${token}`;
    const ttl = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));

    try {
      if (!this.fallbackEnabled && this.redis) {
        await this.redis.setex(key, ttl, 'blacklisted');
      } else {
        this.fallbackStorage.set(key, { value: 'blacklisted', expiresAt });
        this.cleanupExpiredFallback();
      }
    } catch (error) {
      console.error('Error blacklisting token:', error);
      // Fallback to memory storage
      this.fallbackStorage.set(key, { value: 'blacklisted', expiresAt });
    }
  }

  /**
   * Check if token is blacklisted
   */
  async isTokenBlacklisted(token: string): Promise<boolean> {
    const key = `blacklist:${token}`;

    try {
      if (!this.fallbackEnabled && this.redis) {
        const result = await this.redis.get(key);
        return result === 'blacklisted';
      } else {
        const entry = this.fallbackStorage.get(key);
        if (!entry) return false;
        if (entry.expiresAt < Date.now()) {
          this.fallbackStorage.delete(key);
          return false;
        }
        return true;
      }
    } catch (error) {
      console.error('Error checking token blacklist:', error);
      // Check fallback storage
      const entry = this.fallbackStorage.get(key);
      return !!(entry && entry.expiresAt > Date.now());
    }
  }

  /**
   * Store refresh token securely (hashed)
   */
  async storeRefreshToken(token: string, userId: string, expiresAt: number): Promise<void> {
    const hashedToken = this.hashToken(token);
    const key = `refresh:${hashedToken}`;
    const value = JSON.stringify({ userId, expiresAt });
    const ttl = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));

    try {
      if (!this.fallbackEnabled && this.redis) {
        await this.redis.setex(key, ttl, value);
      } else {
        this.fallbackStorage.set(key, { value, expiresAt });
        this.cleanupExpiredFallback();
      }
    } catch (error) {
      console.error('Error storing refresh token:', error);
      this.fallbackStorage.set(key, { value, expiresAt });
    }
  }

  /**
   * Validate refresh token and return user ID
   */
  async validateRefreshToken(token: string): Promise<string | null> {
    const hashedToken = this.hashToken(token);
    const key = `refresh:${hashedToken}`;

    try {
      let result: string | null = null;

      if (!this.fallbackEnabled && this.redis) {
        result = await this.redis.get(key);
      } else {
        const entry = this.fallbackStorage.get(key);
        if (entry && entry.expiresAt > Date.now()) {
          result = entry.value;
        }
      }

      if (!result) return null;

      const data = JSON.parse(result);
      if (data.expiresAt < Date.now()) {
        await this.revokeRefreshToken(token);
        return null;
      }

      return data.userId;
    } catch (error) {
      console.error('Error validating refresh token:', error);
      return null;
    }
  }

  /**
   * Revoke refresh token
   */
  async revokeRefreshToken(token: string): Promise<void> {
    const hashedToken = this.hashToken(token);
    const key = `refresh:${hashedToken}`;

    try {
      if (!this.fallbackEnabled && this.redis) {
        await this.redis.del(key);
      } else {
        this.fallbackStorage.delete(key);
      }
    } catch (error) {
      console.error('Error revoking refresh token:', error);
      this.fallbackStorage.delete(key);
    }
  }

  /**
   * Revoke all refresh tokens for a user
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    try {
      if (!this.fallbackEnabled && this.redis) {
        const pattern = 'refresh:*';
        const keys = await this.redis.keys(pattern);
        
        for (const key of keys) {
          const value = await this.redis.get(key);
          if (value) {
            const data = JSON.parse(value);
            if (data.userId === userId) {
              await this.redis.del(key);
            }
          }
        }
      } else {
        // Fallback: scan through memory storage
        for (const [key, entry] of this.fallbackStorage.entries()) {
          if (key.startsWith('refresh:')) {
            try {
              const data = JSON.parse(entry.value);
              if (data.userId === userId) {
                this.fallbackStorage.delete(key);
              }
            } catch (e) {
              // Invalid entry, remove it
              this.fallbackStorage.delete(key);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error revoking all user tokens:', error);
    }
  }

  /**
   * Hash token for secure storage
   */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Clean up expired entries from fallback storage
   */
  private cleanupExpiredFallback(): void {
    const now = Date.now();
    for (const [key, entry] of this.fallbackStorage.entries()) {
      if (entry.expiresAt < now) {
        this.fallbackStorage.delete(key);
      }
    }
  }

  /**
   * Get connection status
   */
  getStatus(): { connected: boolean; fallback: boolean } {
    return {
      connected: this.redis?.status === 'ready' || false,
      fallback: this.fallbackEnabled
    };
  }

  /**
   * Close Redis connection (for testing)
   */
  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.disconnect();
    }
  }

  /**
   * Clear all data (for testing)
   */
  async clear(): Promise<void> {
    try {
      if (!this.fallbackEnabled && this.redis) {
        await this.redis.flushall();
      }
      this.fallbackStorage.clear();
    } catch (error) {
      console.error('Error clearing token storage:', error);
      this.fallbackStorage.clear();
    }
  }

  /**
   * Generic set method for key-value storage with TTL
   */
  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    try {
      if (!this.fallbackEnabled && this.redis) {
        await this.redis.setex(key, ttlSeconds, value);
      } else {
        // Fallback storage
        const expiresAt = Date.now() + (ttlSeconds * 1000);
        this.fallbackStorage.set(key, { value, expiresAt });
        this.cleanupExpiredFallback();
      }
    } catch (error) {
      console.error('Error setting key-value pair:', error);
      // Fallback to memory storage
      const expiresAt = Date.now() + (ttlSeconds * 1000);
      this.fallbackStorage.set(key, { value, expiresAt });
    }
  }

  /**
   * Generic get method for key-value retrieval
   */
  async get(key: string): Promise<string | null> {
    try {
      if (!this.fallbackEnabled && this.redis) {
        return await this.redis.get(key);
      } else {
        // Fallback storage
        const entry = this.fallbackStorage.get(key);
        if (!entry) {
          return null;
        }
        
        if (Date.now() > entry.expiresAt) {
          this.fallbackStorage.delete(key);
          return null;
        }
        
        return entry.value;
      }
    } catch (error) {
      console.error('Error getting key-value pair:', error);
      // Try fallback storage
      const entry = this.fallbackStorage.get(key);
      if (entry && Date.now() <= entry.expiresAt) {
        return entry.value;
      }
      return null;
    }
  }

  /**
   * Generic delete method for key removal
   */
  async delete(key: string): Promise<void> {
    try {
      if (!this.fallbackEnabled && this.redis) {
        await this.redis.del(key);
      } else {
        this.fallbackStorage.delete(key);
      }
    } catch (error) {
      console.error('Error deleting key:', error);
      // Always try fallback storage
      this.fallbackStorage.delete(key);
    }
  }


}

// Singleton instance
export const redisTokenManager = new RedisTokenManager();

// Export for backward compatibility
export { redisTokenManager as tokenBlacklist, redisTokenManager as refreshTokenManager };