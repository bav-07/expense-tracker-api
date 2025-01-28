import { Router } from 'express';
import { getIncomes, getIncomeById, createIncome, updateIncome, deleteIncome, getIncomeByPeriod } from '../controllers/incomeController';
import { protect } from '../middlewares/authMiddleware';
import validate from '../middlewares/validateMiddleware';
import incomeSchema from '../validations/incomeValidation';

const router = Router();

router.use(protect);

router.get('/', getIncomes);
router.get('/period', getIncomeByPeriod);
router.get('/:id', getIncomeById);
router.post('/', validate(incomeSchema), createIncome);
router.put('/:id', updateIncome);
router.delete('/:id', deleteIncome);

export default router;