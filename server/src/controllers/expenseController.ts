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

  const userId = mongoose.Types.ObjectId.createFromHexString(req.user?.id?.toString());
  const expenses = await Expense.aggregate([
    { $match: { userId, date: { $gte: start, $lte: end } } },
    { $sort: { date: 1 } }
  ]);
  res.status(200).json(expenses);
});

export const createExpense = catchAsync(async (req: IGetUserAuthInfoRequest, res: Response): Promise<void> => {
  const { category, amount, date } = req.body;
  if (!category || !amount || !date) {
    throw new AppError('All fields are required', 400);
  }
  if (typeof date === 'object') {
    throw new AppError('Date field must be a string (YYYY-MM-DD or ISO) — do not send a range object.', 400);
  }
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    throw new AppError('Invalid date format. Expected YYYY-MM-DD or ISO string.', 400);
  }
  const expense = new Expense({ userId: req.user?.id, category, amount, date: parsedDate });
  await expense.save();
  res.status(201).json({ expense });
});

export const updateExpense = catchAsync(async (req: IGetUserAuthInfoRequest, res: Response): Promise<void> => {
  const { category, amount, date } = req.body;
  if (!category && !amount && !date) {
    throw new AppError('At least one of the following fields are required: category, amount, date', 400);
  }
  const update: any = {};
  if (category !== undefined) update.category = category;
  if (amount !== undefined) update.amount = amount;
  if (date !== undefined) {
    if (typeof date === 'object') {
      throw new AppError('Date field must be a string (YYYY-MM-DD or ISO), not an object.', 400);
    }
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) {
      throw new AppError('Invalid date format. Expected YYYY-MM-DD or ISO string.', 400);
    }
    update.date = parsed;
  }
  const expense = await Expense.findOneAndUpdate({ _id: req.params.id, userId: req.user?.id }, update, { new: true });
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