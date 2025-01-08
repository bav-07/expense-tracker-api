import { Router } from 'express';
import { register, login, getUserProfile } from '../controllers/authController';
import { protect } from '../middlewares/authMiddleware';

const router = Router();

router.get('/profile', protect, getUserProfile);
router.post('/register', register);
router.post('/login', login);

export default router;