import { NextFunction, Response } from "express";
import Income from "../models/incomeModel";
import { IGetUserAuthInfoRequest } from "../config/definitions";
import mongoose from "mongoose";
import catchAsync from "../utils/catchAsync";
import { AppError } from "../middlewares/errorHandler";

export const getIncomes = catchAsync(async (req: IGetUserAuthInfoRequest, res: Response): Promise<void> => {
  const incomes = await Income.find({ userId: req.user?.id });
  res.status(200).json({ incomes });
});

export const getIncomeById = catchAsync(async (req: IGetUserAuthInfoRequest, res: Response, next: NextFunction): Promise<void> => {
  const income = await Income.findOne({ _id: req.params.id, userId: req.user?.id });
  if (!income) {
    throw new AppError('Income not found', 404);
  }
  res.status(200).json({ income });
});

export const getIncomeByPeriod = catchAsync(async (req: IGetUserAuthInfoRequest, res: Response): Promise<void> => {
  const { startDate, endDate } = req.query;
  if ( !startDate || !endDate) {
    throw new AppError('Missing required query parameters: startDate, endDate', 400);
  }

  const start = new Date(startDate as string);
  const end = new Date(endDate as string);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new AppError('Invalid date format. Use YYYY-MM-DD', 400);
  }

  const userId = mongoose.Types.ObjectId.createFromHexString(req.user?.id?.toString());
  const incomes = await Income.aggregate([
    { $match: { userId, date: { $gte: start, $lte: end } } },
    { $sort: { date: 1 } }
  ]);
  res.status(200).json(incomes);
});

export const createIncome = catchAsync(async (req: IGetUserAuthInfoRequest, res: Response): Promise<void> => {
  const { source, amount, date, frequency } = req.body;
  if (!source || !amount || !date) {
    throw new AppError('Source, amount and date are required', 400);
  }
  if (frequency && !['monthly', 'weekly'].some(f => f === frequency)) {
    throw new AppError('Invalid frequency. Use either "monthly" or "weekly"', 400);
  }
  if (typeof date === 'object') {
    throw new AppError('Date field must be a string (YYYY-MM-DD or ISO) — do not send a range object.', 400);
  }
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    throw new AppError('Invalid date format. Expected YYYY-MM-DD or ISO string.', 400);
  }
  const income = new Income({ userId: req.user?.id, source, amount, date: parsedDate, frequency });
  await income.save();
  res.status(201).json({ income });
});

export const updateIncome = catchAsync(async (req: IGetUserAuthInfoRequest, res: Response): Promise<void> => {
  const { source, amount, date, frequency } = req.body;
  if (!source && !amount && !date && !frequency) {
    throw new AppError('At least one of the following fields are required: source, amount, date, frequency', 400);
  }
  const update: any = {};
  if (source !== undefined) update.source = source;
  if (amount !== undefined) update.amount = amount;
  if (frequency !== undefined) {
    if (frequency && !['monthly', 'weekly'].includes(frequency)) {
      throw new AppError('Invalid frequency. Use either "monthly" or "weekly"', 400);
    }
    update.frequency = frequency;
  }
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
  const income = await Income.findOneAndUpdate({ _id: req.params.id, userId: req.user?.id }, update, { new: true });
  if (!income) {
    throw new AppError('Income not found', 404);
  }
  res.status(200).json({ income });
});

export const deleteIncome = catchAsync(async (req: IGetUserAuthInfoRequest, res: Response): Promise<void> => {
  const income = await Income.findOneAndDelete({ _id: req.params.id, userId: req.user?.id });
  if (!income) {
    throw new AppError('Income not found', 404);
  }
  res.status(200).json({ income });
});