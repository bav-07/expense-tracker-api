import { Request, Response } from "express";
import Income from "../models/incomeModel";
import { IGetUserAuthInfoRequest } from "../config/definitions";
import User from "../models/userModel";
import { contentSecurityPolicy } from "helmet";
import mongoose from "mongoose";

export const getIncomes = async (req: IGetUserAuthInfoRequest, res: Response): Promise<void> => {
  try {
    const incomes = await Income.find({ userId: req.user?.id });
    res.status(200).json({ incomes });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve incomes'});
  }
};

export const getIncomeById = async (req: IGetUserAuthInfoRequest, res: Response): Promise<void> => {
  try {
    const income = await Income.findOne({ _id: req.params.id, userId: req.user?.id });
    if (!income) {
      res.status(404).json({ error: 'Income not found'});
      return;
    }
    res.status(200).json({ income });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve income'});
  }
};

export const getIncomeByPeriod = async (req: IGetUserAuthInfoRequest, res: Response): Promise<void> => {
  try {
      const { period, startDate, endDate } = req.body;

      // Validate query parameters
      if (!period || !startDate || !endDate) {
          res.status(400).json({ error: 'Missing required query parameters: period, startDate, endDate' });
          return;
      }

      if (period !== 'week' && period !== 'month') {
          res.status(400).json({ error: 'Invalid period value. Must be "week" or "month".' });
          return;
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          res.status(400).json({ error: 'Invalid date format. Use ISO strings.' });
          return;
      }

      console.log('Query Params:', { period, startDate, endDate });

      const pipeline = [
          {
              $match: {
                  userId: mongoose.Types.ObjectId.createFromHexString(req.user?.id?.toString()),
                  date: { $gte: start, $lte: end },
              },
          },
          {
              $sort: { date: 1 as const },
          },
          {
            $group: {
              _id: period === 'week' ? { $week: '$date' } : { $month: '$date' },
              totalIncome: { $sum: '$amount' },
            },
          },
      ];

      console.log('Aggregation Pipeline:', JSON.stringify(pipeline, null, 2));

      const income = await Income.aggregate(pipeline);
      res.status(200).json(income);
  } catch (error) {
      console.error('Error during aggregation:', error);
      res.status(500).json({ error: 'Failed to retrieve income by period' });
  }
};

// export const calculateSavings = async (req: IGetUserAuthInfoRequest, res: Response): Promise<void> => {
//   try {
//     const { startDate, endDate } = req.query;
//     const income = await Income.aggregate([
//       {
//         $match: {
//           userId: req.user?.id,
//           date: {
//             $gte: new Date(startDate as string),
//             $lte: new Date(endDate as string),
//           }
//         }
//       },
//       {
//         $group: {
//           _id: null,
//           totalIncome: { $sum: '$amount' }
//         }
//       }
//     ])
//     const expenses = await Expense.aggregate([
//       {
//         $match: {
//           userId: req.user?.id,
//           date: {
//             $gte: new Date(startDate as string),
//             $lte: new Date(endDate as string),
//           }
//         }
//       },
//       {
//         $group: {
//           _id: null,
//           totalExpenses: { $sum: '$amount' }
//         }
//       }
//     ])
//   } catch (error) {
//     res.status(500).json({ error: 'Failed to calculate savings'});
//   }
// };

export const createIncome = async (req: IGetUserAuthInfoRequest, res: Response): Promise<void> => {
  try {
    const { source, amount, date, frequency } = req.body;
    if (!source || !amount || !date || !frequency) {
      console.log(source, amount, date, frequency)
      res.status(400).json({ error: 'All fields are required'});
      return;
    }
    const income = new Income({ userId: req.user?.id, source, amount, date, frequency });
    await income.save();
    res.status(201).json({ income });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create income'});
  }
};

export const updateIncome = async (req: IGetUserAuthInfoRequest, res: Response): Promise<void> => {
  try {
    const { source, amount, date, frequency } = req.body;
    if (!source || !amount || !date || !frequency) {
      res.status(400).json({ error: 'All fields are required'});
      return;
    }
    const income = await Income.findOneAndUpdate({ _id: req.params.id, userId: req.user?.id }, { source, amount, date, frequency }, { new: true });
    if (!income) {
      res.status(404).json({ error: 'Income not found'});
      return;
    }
    res.status(200).json({ income });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update income'});
  }
};

export const deleteIncome = async (req: IGetUserAuthInfoRequest, res: Response): Promise<void> => {
  try {
    const income = await Income.findOneAndDelete({ _id: req.params.id, userId: req.user?.id });
    if (!income) {
      res.status(404).json({ error: 'Income not found'});
      return;
    }
    res.status(200).json({ income });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete income'});
  }
};