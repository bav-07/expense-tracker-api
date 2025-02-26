import { Router } from 'express';
import { 
  getExpenses, 
  getExpenseById, 
  createExpense, 
  updateExpense, 
  deleteExpense, 
  getExpensesByPeriod
} from '../controllers/expenseController';
import { protect } from '../middlewares/authMiddleware';
import { expenseSchema, updateExpenseSchema } from '../validations/expenseValidation';
import validate from '../middlewares/validateMiddleware';
import { validateObjectId } from '../validations/validateParams';
import { dateRangeSchema } from '../validations/validationSchemas';
import { validateQuery } from '../validations/validateQuery';

const router = Router();

router.use(protect);

router.get('/', getExpenses);
router.get('/period', validateQuery(dateRangeSchema), getExpensesByPeriod);
router.get('/:id', validateObjectId, getExpenseById);
router.post('/', validate(expenseSchema), createExpense);
router.put('/:id', validateObjectId, validate(updateExpenseSchema), updateExpense);
router.delete('/:id', validateObjectId, deleteExpense);

export default router;