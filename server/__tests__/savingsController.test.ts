import request from 'supertest';
import app from '../src/index';
import mongoose, { Connection } from 'mongoose';
import Income from '../src/models/incomeModel';
import Expense from '../src/models/expenseModel';

describe('Savings Controller', () => {
  const testUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
  };

  let token: string;
  let testConnection: Connection;

  beforeAll(async () => {
    const testUri = process.env.MONGO_TEST_URI || 'mongodb://localhost:27017/express-jwt-auth-test';
    testConnection = mongoose.createConnection(testUri);
    await mongoose.connection.db?.dropDatabase();
    const res = await request(app)
      .post('/api/users/register')
      .send(testUser);
    token = res.body.token; // Save the token for future tests

    const income = new Income({
      source: 'Salary',
      amount: 1000,
      date: '2022-01-01',
      frequency: 'monthly',
      userId: res.body.user.id,
    });
    await income.save();

    const expense = new Expense({
      category: 'Bill',
      amount: 100,
      date: '2022-01-01',
      userId: res.body.user.id,
    });
    await expense.save();
  });

  afterAll(async () => {
    await mongoose.connection.db?.dropDatabase();
    await testConnection.close();
    await mongoose.connection.close();
  });

  it('should calculate savings', async () => {
    const res = await request(app)
      .get('/api/savings?startDate=2021-12-01&endDate=2022-01-31')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('totalIncome', 1000);
    expect(res.body).toHaveProperty('totalExpenses', 100);
    expect(res.body).toHaveProperty('savings', 900);
  });

  it('should not calculate savings if no start or end date is provided', async () => {
    const res = await request(app)
      .get('/api/savings')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', ["\"startDate\" field is required", "\"endDate\" field is required"]);
  });

  it('should not calculate savings if provided dates are in invalid format', async () => {
    const res = await request(app)
      .get('/api/savings?startDate=2021-01-34&endDate=2022-31-12')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', ["\"startDate\" must be in ISO 8601 date format", "\"endDate\" must be in ISO 8601 date format"]);
  });
});