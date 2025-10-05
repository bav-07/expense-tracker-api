import argon2 from 'argon2';

/**
 * Production-grade password hashing service using Argon2id
 * Provides superior protection against GPU and ASIC attacks
 */
export class PasswordService {
  private static readonly options = {
    type: argon2.argon2id,
    memoryCost: 2 ** 16, // 64 MB memory usage
    timeCost: 3,         // 3 iterations
    parallelism: 1,      // 1 thread (adjust based on server capacity)
    hashLength: 32,      // 32-byte hash output
  };

  /**
   * Hash a password using Argon2id with high security parameters
   * @param password - Plain text password to hash
   * @returns Promise<string> - Argon2id hash
   */
  static async hashPassword(password: string): Promise<string> {
    try {
      return await argon2.hash(password, this.options);
    } catch (error) {
      throw new Error(`Password hashing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Verify a password against an Argon2id hash
   * @param hash - The Argon2id hash to verify against
   * @param password - The plain text password
   * @returns Promise<boolean> - True if password matches
   */
  static async verifyPassword(hash: string, password: string): Promise<boolean> {
    try {
      const result = await argon2.verify(hash, password);
      return result;
    } catch (error) {
      console.error('Password verification error:', error);
      if (error instanceof Error) {
        console.error('Error type:', error.constructor.name);
        console.error('Error message:', error.message);
      }
      return false;
    }
  }

  /**
   * Check if a hash needs rehashing (e.g., if security parameters changed)
   * @param hash - Existing hash to check
   * @returns boolean - True if hash should be regenerated
   */
  static needsRehash(hash: string): boolean {
    try {
      // Check if the hash uses the current algorithm and parameters
      return argon2.needsRehash(hash, this.options);
    } catch (error) {
      // If we can't parse the hash, it should be regenerated
      return true;
    }
  }

  /**
   * Migrate from bcrypt to Argon2id if needed
   * This method can be used during user login to upgrade old bcrypt hashes
   * @param password - Plain text password
   * @param existingHash - Current hash (could be bcrypt or argon2)
   * @returns Promise<{isValid: boolean, newHash?: string}> 
   */
  static async migratePassword(password: string, existingHash: string): Promise<{isValid: boolean, newHash?: string}> {
    try {
      // Check if it's a bcrypt hash (starts with $2a$, $2b$, or $2y$)
      const isBcrypt = /^\$2[ayb]\$/.test(existingHash);
      
      if (isBcrypt) {
        // Verify with bcrypt
        const bcrypt = await import('bcrypt');
        const isValid = await bcrypt.compare(password, existingHash);
        
        if (isValid) {
          // Generate new Argon2id hash
          const newHash = await this.hashPassword(password);
          return { isValid: true, newHash };
        }
        return { isValid: false };
      } else {
        // Assume it's Argon2, verify normally
        const isValid = await this.verifyPassword(existingHash, password);
        
        // Check if it needs rehashing with updated parameters
        if (isValid && this.needsRehash(existingHash)) {
          const newHash = await this.hashPassword(password);
          return { isValid: true, newHash };
        }
        
        return { isValid };
      }
    } catch (error) {
      console.error('Password migration error:', error);
      return { isValid: false };
    }
  }
}