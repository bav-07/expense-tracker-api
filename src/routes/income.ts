import { Router } from 'express';
import { getIncomes, getIncomeById, createIncome, updateIncome, deleteIncome, getIncomeByPeriod } from '../controllers/incomeController';
import { protect } from '../middlewares/authMiddleware';
import validate from '../middlewares/validateMiddleware';
import incomeSchema from '../validations/incomeValidation';
import { validateObjectId } from '../validations/validateParams';
import { validateQuery } from '../validations/validateQuery';
import { dateRangeSchema } from '../validations/validationSchemas';

const router = Router();

router.use(protect);

router.get('/', getIncomes);
router.get('/period', validateQuery(dateRangeSchema), getIncomeByPeriod);
router.get('/:id', validateObjectId, getIncomeById);
router.post('/', validate(incomeSchema), createIncome);
router.put('/:id', validateObjectId, updateIncome);
router.delete('/:id', validateObjectId, deleteIncome);

export default router;