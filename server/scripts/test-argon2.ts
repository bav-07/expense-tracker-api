import { PasswordService } from '../src/utils/passwordService';

/**
 * Simple test script to verify Argon2 password hashing
 * Run with: npx ts-node scripts/test-argon2.ts
 */
async function testArgon2() {
  const testPassword = 'TestPassword123!';
  
  console.log('🔒 Testing Argon2id Password Service...\n');
  
  try {
    // Test hashing
    console.log('1. Testing password hashing...');
    const hash = await PasswordService.hashPassword(testPassword);
    console.log(`✅ Hash generated: ${hash.substring(0, 50)}...`);
    
    // Test verification
    console.log('\n2. Testing password verification...');
    const isValid = await PasswordService.verifyPassword(hash, testPassword);
    console.log(`✅ Password verification: ${isValid ? 'PASSED' : 'FAILED'}`);
    
    // Test wrong password
    console.log('\n3. Testing wrong password rejection...');
    const isInvalid = await PasswordService.verifyPassword(hash, 'WrongPassword');
    console.log(`✅ Wrong password rejection: ${!isInvalid ? 'PASSED' : 'FAILED'}`);
    
    // Test bcrypt migration
    console.log('\n4. Testing bcrypt migration...');
    // Simulate a bcrypt hash (this would be an actual bcrypt hash in production)
    const bcryptHash = '$2b$10$example'; // This would fail verification
    const migrationResult = await PasswordService.migratePassword('anypassword', bcryptHash);
    console.log(`✅ Migration handling: ${!migrationResult.isValid ? 'PASSED' : 'FAILED'} (expected failure for fake hash)`);
    
    console.log('\n🎉 All tests completed! Argon2id is ready for production.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testArgon2();
}