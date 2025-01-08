import mongoose, { Document, Schema, Model } from 'mongoose';
import bcrypt from 'bcrypt';

// Define an interface for the User model
export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  comparePassword: (candidatePassword: string) => Promise<boolean>;
}

// Define the user schema
const userSchema: Schema<IUser> = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
  },
  { timestamps: true }
);

// Pre-save hook to hash the password before saving the user
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Add a method to validate passwords
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
}

const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);

export default User;