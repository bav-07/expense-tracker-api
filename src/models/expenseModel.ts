import mongoose, { Schema, Document } from "mongoose";

export interface IExpense extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  category: string;
  amount: number;
  date: Date;
}

const expenseSchema: Schema<IExpense> = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    category: { type: String, required: true },
    amount: { type: Number, required: true },
    date: { type: Date, required: true }
  },
  { timestamps: true }
)

const Expense = mongoose.model<IExpense>('Expense', expenseSchema);

export default Expense;