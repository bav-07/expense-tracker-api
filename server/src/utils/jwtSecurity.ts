import crypto from 'crypto';

interface JWTConfig {
  secret: string;
  expiresIn: string;
  refreshExpiresIn: string;
}

class JWTSecurityManager {
  private static readonly MIN_SECRET_LENGTH = 32;
  private static readonly RECOMMENDED_SECRET_LENGTH = 64;

  /**
   * Validates JWT secret strength
   */
  static validateSecret(secret: string): { isValid: boolean; warnings: string[] } {
    const warnings: string[] = [];
    
    if (!secret) {
      return { isValid: false, warnings: ['JWT_SECRET is required'] };
    }

    if (secret.length < this.MIN_SECRET_LENGTH) {
      return { 
        isValid: false, 
        warnings: [`JWT_SECRET must be at least ${this.MIN_SECRET_LENGTH} characters long`] 
      };
    }

    if (secret.length < this.RECOMMENDED_SECRET_LENGTH) {
      warnings.push(`JWT_SECRET should be at least ${this.RECOMMENDED_SECRET_LENGTH} characters for better security`);
    }

    // Check for common weak patterns
    if (secret.includes('secret') || secret.includes('password') || secret.includes('key')) {
      warnings.push('JWT_SECRET should not contain common words like "secret", "password", or "key"');
    }

    // Check for sufficient entropy (basic check)
    const uniqueChars = new Set(secret).size;
    if (uniqueChars < 16) {
      warnings.push('JWT_SECRET has low entropy - consider using more diverse characters');
    }

    return { isValid: true, warnings };
  }

  /**
   * Generates a cryptographically secure JWT secret
   */
  static generateSecureSecret(length: number = 64): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Gets JWT configuration with validation
   */
  static getJWTConfig(): JWTConfig {
    const secret = process.env.JWT_SECRET;
    const validation = this.validateSecret(secret || '');
    
    if (!validation.isValid) {
      throw new Error(`JWT Security Error: ${validation.warnings.join(', ')}`);
    }

    // Log warnings in development
    if (process.env.NODE_ENV === 'development' && validation.warnings.length > 0) {
      console.warn('JWT Security Warnings:', validation.warnings);
    }

    return {
      secret: secret!,
      expiresIn: process.env.JWT_EXPIRES_IN || '1h',
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
    };
  }

  /**
   * Validates environment configuration
   */
  static validateEnvironment(): void {
    const requiredVars = ['JWT_SECRET'];
    const missing = requiredVars.filter(varName => !process.env[varName]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    // Validate JWT secret
    this.getJWTConfig();
  }
}

export default JWTSecurityManager;