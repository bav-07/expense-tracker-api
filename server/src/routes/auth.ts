import { Router } from 'express';
import { register, login, getUserProfile, updatePreferences, logout, refreshAccessToken, getSecurityInfo, revokeAllTokens } from '../controllers/authController';
import { protect } from '../middlewares/authMiddleware';
import validate from '../middlewares/validateMiddleware';
import { loginSchema, registerSchema, updatePreferencesSchema } from '../validations/authValidation';
import { loginRateLimiter, registerRateLimiter } from '../middlewares/rateLimiter';
import { csrfProtect } from '../middlewares/csrfProtection';

const router = Router();

router.get('/profile', protect, getUserProfile);
router.get('/security', protect, getSecurityInfo);
router.post('/register', registerRateLimiter, validate(registerSchema), register);
router.post('/login', loginRateLimiter, validate(loginSchema), login);
router.post('/logout', csrfProtect, protect, logout);
router.post('/revoke-all', csrfProtect, protect, revokeAllTokens);
router.post('/refresh', refreshAccessToken);
router.put('/preferences', csrfProtect, protect, validate(updatePreferencesSchema), updatePreferences);

export default router;