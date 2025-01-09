import { Router } from 'express';
import { getIncomes, getIncomeById, createIncome, updateIncome, deleteIncome } from '../controllers/incomeController';
import { protect } from '../middlewares/authMiddleware';

const router = Router();

router.use(protect);

router.get('/', getIncomes);
router.get('/:id', getIncomeById);
router.post('/', createIncome);
router.put('/:id', updateIncome);
router.delete('/:id', deleteIncome);

export default router;