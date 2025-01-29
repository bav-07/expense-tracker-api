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
import expenseSchema from '../validations/expenseValidation';
import validate from '../middlewares/validateMiddleware';

const router = Router();

router.use(protect);

router.get('/', getExpenses);
router.get('/period', getExpensesByPeriod);
router.get('/:id', getExpenseById);
router.post('/', validate(expenseSchema), createExpense);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);

export default router;