import { Response } from "express";
import { IGetUserAuthInfoRequest } from "../config/definitions";
import Expense from "../models/expenseModel";
import mongoose from "mongoose";

export const getExpenses = async (req: IGetUserAuthInfoRequest, res: Response): Promise<void> => {
  try {
    const expenses = await Expense.find({ userId: req.user?.id }).sort({ date: 'asc' });
    res.status(200).json({ expenses });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}

export const getExpenseById = async(req: IGetUserAuthInfoRequest, res: Response): Promise<void> => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, userId: req.user?.id });
    if (!expense) {
      res.status(404).json({ message: "Expense not found" });
      return;
    }
    res.status(200).json({ expense });
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve expense" });
  }
}

export const getExpensesByPeriod = async (req: IGetUserAuthInfoRequest, res: Response): Promise<void> => {
  try {
      const { startDate, endDate } = req.body;

      if ( !startDate || !endDate) {
          res.status(400).json({ error: 'Missing required query parameters: startDate, endDate' });
          return;
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
          return;
      }

      const expenses = await Expense.find({
        userId: mongoose.Types.ObjectId.createFromHexString(req.user?.id?.toString()),
        date: { $gte: start, $lte: end },
      }).sort({ date: 'asc' });

      res.status(200).json(expenses);
  } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve expenses by period' });
  }
};

export const createExpense = async (req: IGetUserAuthInfoRequest, res: Response): Promise<void> => {
  try {
    const { category, amount, date } = req.body;
    if (!category || !amount || !date) {
      res.status(400).json({ message: "All fields are required" });
      return;
    }
    const expense = new Expense({ userId: req.user?.id, category, amount, date });
    await expense.save();
    res.status(201).json({ expense });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}

export const updateExpense = async (req: IGetUserAuthInfoRequest, res: Response): Promise<void> => {
  try {
    const { category, amount, date } = req.body;
    const expense = await Expense.findOneAndUpdate({ _id: req.params.id, userId: req.user?.id }, { category, amount, date }, { new: true });
    if (!expense) {
      res.status(404).json({ message: "Expense not found" });
      return;
    }
    res.status(200).json({ expense });
  } catch (error) {
    res.status(500).json({ error: "Failed to update expense" });
  }
}

export const deleteExpense = async (req: IGetUserAuthInfoRequest, res: Response): Promise<void> => {
  try {
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, userId: req.user?.id });
    if (!expense) {
      res.status(404).json({ message: "Expense not found" });
      return;
    }
    res.status(200).json({ expense });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete expense" });
  }
}