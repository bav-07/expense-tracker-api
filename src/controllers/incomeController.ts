import { Request, Response } from "express";
import Income from "../models/incomeModel";
import { IGetUserAuthInfoRequest } from "../config/definitions";

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

export const createIncome = async (req: IGetUserAuthInfoRequest, res: Response): Promise<void> => {
  try {
    const { source, amount, date } = req.body;
    if (!source || !amount || !date) {
      console.log(source, amount, date)
      res.status(400).json({ error: 'All fields are required'});
      return;
    }
    const income = new Income({ userId: req.user?.id, source, amount, date });
    await income.save();
    res.status(201).json({ income });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create income'});
  }
};

export const updateIncome = async (req: IGetUserAuthInfoRequest, res: Response): Promise<void> => {
  try {
    const { source, amount, date } = req.body;
    if (!source || !amount || !date) {
      res.status(400).json({ error: 'All fields are required'});
      return;
    }
    const income = await Income.findOneAndUpdate({ _id: req.params.id, userId: req.user?.id }, { source, amount, date }, { new: true });
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