import { Router } from 'express';
import { register, login, getUserProfile, updatePreferences } from '../controllers/authController';
import { protect } from '../middlewares/authMiddleware';
import validate from '../middlewares/validateMiddleware';
import { loginSchema, registerSchema, updatePreferencesSchema } from '../validations/authValidation';
import { loginRateLimiter, registerRateLimiter } from '../middlewares/rateLimiter';

const router = Router();

router.get('/profile', protect, getUserProfile);
router.post('/register', registerRateLimiter, validate(registerSchema), register);
router.post('/login', loginRateLimiter, validate(loginSchema), login);
router.put('/preferences', protect, validate(updatePreferencesSchema), updatePreferences);

export default router;