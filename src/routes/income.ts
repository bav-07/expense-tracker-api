import { Router } from 'express';
import { getIncomes, getIncomeById, createIncome, updateIncome, deleteIncome, getIncomeByPeriod } from '../controllers/incomeController';
import { protect } from '../middlewares/authMiddleware';

const router = Router();

router.use(protect);

router.get('/', getIncomes);
router.get('/period', getIncomeByPeriod);
router.get('/:id', getIncomeById);
router.post('/', createIncome);
router.put('/:id', updateIncome);
router.delete('/:id', deleteIncome);

export default router;