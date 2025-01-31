import { Router } from "express";
import { protect } from "../middlewares/authMiddleware";
import { calculateSavings } from "../controllers/savingsController";
import { validateQuery } from "../validations/validateQuery";
import { dateRangeSchema } from "../validations/validationSchemas";

const router = Router();

router.use(protect);

router.get('/', validateQuery(dateRangeSchema), calculateSavings);

export default router;