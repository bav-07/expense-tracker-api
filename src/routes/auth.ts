import { Router } from 'express';
import { register, login, getUserProfile, updatePreferences } from '../controllers/authController';
import { protect } from '../middlewares/authMiddleware';

const router = Router();

router.get('/profile', protect, getUserProfile);
router.post('/register', register);
router.post('/login', login);
router.put('/preferences', protect, updatePreferences);

export default router;