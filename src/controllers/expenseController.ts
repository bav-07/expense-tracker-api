import { Response } from "express";
import { IGetUserAuthInfoRequest } from "../config/definitions";
import Expense from "../models/expenseModel";
import mongoose from "mongoose";
import catchAsync from "../utils/catchAsync";
import { AppError } from "../middlewares/errorHandler";

export const getExpenses = catchAsync(async (req: IGetUserAuthInfoRequest, res: Response): Promise<void> => {
  const expenses = await Expense.find({ userId: req.user?.id }).sort({ date: 'asc' });
  res.status(200).json({ expenses });
});

export const getExpenseById = catchAsync(async(req: IGetUserAuthInfoRequest, res: Response): Promise<void> => {
  const expense = await Expense.findOne({ _id: req.params.id, userId: req.user?.id });
  if (!expense) {
    throw new AppError('Expense not found', 404);
  }
  res.status(200).json({ expense });
});

export const getExpensesByPeriod = catchAsync(async (req: IGetUserAuthInfoRequest, res: Response): Promise<void> => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    throw new AppError('Missing required query parameters: startDate, endDate', 400);
  }

  const start = new Date(startDate as string);
  const end = new Date(endDate as string);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new AppError('Invalid date format. Use YYYY-MM-DD', 400);
  }

  const expenses = await Expense.find({
    userId: mongoose.Types.ObjectId.createFromHexString(req.user?.id?.toString()),
    date: { $gte: start, $lte: end },
  }).sort({ date: 'asc' });

  res.status(200).json(expenses);
});

export const createExpense = catchAsync(async (req: IGetUserAuthInfoRequest, res: Response): Promise<void> => {
  const { category, amount, date } = req.body;
  if (!category || !amount || !date) {
    throw new AppError('All fields are required', 400);
  }
  const expense = new Expense({ userId: req.user?.id, category, amount, date });
  await expense.save();
  res.status(201).json({ expense });
});

export const updateExpense = catchAsync(async (req: IGetUserAuthInfoRequest, res: Response): Promise<void> => {
  const { category, amount, date } = req.body;
  const expense = await Expense.findOneAndUpdate({ _id: req.params.id, userId: req.user?.id }, { category, amount, date }, { new: true });
  if (!expense) {
    throw new AppError('Expense not found', 404);
  }
  res.status(200).json({ expense });
});

export const deleteExpense = catchAsync(async (req: IGetUserAuthInfoRequest, res: Response): Promise<void> => {
  const expense = await Expense.findOneAndDelete({ _id: req.params.id, userId: req.user?.id });
  if (!expense) {
    throw new AppError('Expense not found', 404);
  }
  res.status(200).json({ expense });
});