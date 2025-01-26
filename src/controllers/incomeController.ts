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

      const incomes = await Income.find({
        userId: mongoose.Types.ObjectId.createFromHexString(req.user?.id?.toString()),
        date: { $gte: start, $lte: end },
      }).sort({ date: 'asc' });

      res.status(200).json(incomes);
  } catch (error) {
      console.error('Error during aggregation:', error);
      res.status(500).json({ error: 'Failed to retrieve income by period' });
  }
};

export const createIncome = async (req: IGetUserAuthInfoRequest, res: Response): Promise<void> => {
  try {
    const { source, amount, date, frequency } = req.body;
    if (!source || !amount || !date) {
      res.status(400).json({ error: 'Source, amount and date are required'});
      return;
    }
    if (frequency && !['monthly', 'weekly'].some(f => f === frequency)) {
      res.status(400).json({ error: 'Invalid frequency. Use either "monthly" or "weekly"'});
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