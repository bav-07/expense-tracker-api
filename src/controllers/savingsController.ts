import { Response } from "express";
import { IGetUserAuthInfoRequest } from "../config/definitions";
import Income from "../models/incomeModel";
import Expense from "../models/expenseModel";
import mongoose from "mongoose";


export const calculateSavings = async (req: IGetUserAuthInfoRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
      res.status(400).json({ error: 'Missing required query parameters: startDate, endDate' });
      return;
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
      return;
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
  } catch (error) {
    res.status(500).json({ error: "Failed to calculate savings" });
  }
}