import mongoose, { Connection } from "mongoose";
import { IExpense } from "../src/models/expenseModel";
import request from "supertest";
import app from "../src/index";

describe('Expense Controller Tests', () => {
  let token: string;
  let testConnection: Connection;
  let testExpense: IExpense;

  beforeAll(async () => {
    testConnection = mongoose.createConnection(process.env.TEST_MONGO_URI as string);
    await mongoose.connection.db?.dropDatabase();

    const testUser = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    };

    const res = await request(app)
      .post('/api/users/register')
      .send(testUser);
    token = res.body.token; // Save the token for future tests
  });

  afterAll(async () => {
    await mongoose.connection.db?.dropDatabase();
    await testConnection.close();
    await mongoose.connection.close();
  });

  it('should create a new expense', async () => {
    const res = await request(app)
      .post('/api/expense')
      .set('Authorization', `Bearer ${token}`)
      .send({
        category: 'Bill',
        amount: 100,
        date: '2022-01-01',
      });
    expect(res.status).toBe(201);
  });
})
