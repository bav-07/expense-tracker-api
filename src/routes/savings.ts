import { Router } from "express";
import { protect } from "../middlewares/authMiddleware";
import { calculateSavings } from "../controllers/savingsController";

const router = Router();

router.use(protect);

router.get('/', calculateSavings);

export default router;