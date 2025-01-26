import mongoose, { Schema, Document } from 'mongoose';

export interface IIncome extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  source: string;
  amount: number;
  date: Date;
  frequency?: string;
}

const incomeSchema: Schema<IIncome> = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    source: { type: String, required: true },
    amount: { type: Number, required: true },
    date: { type: Date, required: true },
    frequency: { type: String, enum: ['weekly', 'monthly'] }
  },
  { timestamps: true }
);

const Income = mongoose.model('Income', incomeSchema);

export default Income;