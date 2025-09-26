import { Response } from "express";
import { IGetUserAuthInfoRequest } from "../config/definitions";
import Income from "../models/incomeModel";
import Expense from "../models/expenseModel";
import mongoose from "mongoose";
import catchAsync from "../utils/catchAsync";


export const calculateSavings = catchAsync(async (req: IGetUserAuthInfoRequest, res: Response) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    throw new Error('Missing required query parameters: startDate, endDate');
  }

  const start = new Date(startDate as string);
  const end = new Date(endDate as string);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error('Invalid date format. Use YYYY-MM-DD');
  }

  end.setHours(23, 59, 59, 999); // Set end date to end of day

  const userId = mongoose.Types.ObjectId.createFromHexString(req.user?.id?.toString())

  const totalIncomeResult = await Income.aggregate([
    {
      $match: {
        userId: userId,
        date: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: null,
        totalIncome: { $sum: "$amount" }
      }
    }
  ]);

  const totalIncome = totalIncomeResult[0]?.totalIncome || 0;

  const totalExpensesResult = await Expense.aggregate([
    {
      $match: {
        userId: userId,
        date: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: null,
        totalExpenses: { $sum: "$amount" }
      }
    }
  ]);

  const totalExpenses = totalExpensesResult[0]?.totalExpenses || 0;

  const savings = totalIncome - totalExpenses;

  res.status(200).json({ 
    totalIncome,
    totalExpenses,
    savings
  });
});