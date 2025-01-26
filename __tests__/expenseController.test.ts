import mongoose, { Connection } from "mongoose";
import { IExpense } from "../src/models/expenseModel";
import request from "supertest";
import app from "../src/index";

describe('Expense Controller Tests', () => {
  const testUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
  };

  let token: string;
  let testConnection: Connection;

  beforeAll(async () => {
    testConnection = mongoose.createConnection(process.env.TEST_MONGO_URI as string);
    await mongoose.connection.db?.dropDatabase();
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
  
  it('should get all expenses', async () => {
    const addedExpenseRes = await request(app)
      .post('/api/expense')
      .set('Authorization', `Bearer ${token}`)
      .send({
        category: 'Groceries',
        amount: 200,
        date: '2022-03-01',
      });

    const res = await request(app)
      .get('/api/expense')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.expenses).toBeDefined();
    expect(res.body.expenses.length).toBe(2);
    expect(res.body.expenses[1]._id).toBe(addedExpenseRes.body.expense._id);
  });

  it('should get an expense by ID', async () => {
    const newExpenseResponse = await request(app)
      .post('/api/expense')
      .set('Authorization', `Bearer ${token}`)
      .send({
        category: 'Groceries',
        amount: 50,
        date: '2022-01-02',
      });

    const res = await request(app)
      .get(`/api/expense/${newExpenseResponse.body.expense._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.expense).toBeDefined();
  });

  it('should get expenses by period', async () => {
    const res = await request(app)
      .get('/api/expense/period')
      .set('Authorization', `Bearer ${token}`)
      .send({
        startDate: '2022-01-01',
        endDate: '2022-12-31',
      });
    console.log(res.body);
    expect(res.status).toBe(200);
    expect(res.body).toBeInstanceOf(Array);
    expect(res.body.length).toBe(3);
  });

  it('should update an expense', async () => {
    const newExpense = await request(app)
      .post('/api/expense')
      .set('Authorization', `Bearer ${token}`)
      .send({
        category: 'Transport',
        amount: 20,
        date: '2022-01-03',
      });
    expect(newExpense.body.expense.amount).toBe(20);

    const res = await request(app)
      .put(`/api/expense/${newExpense.body.expense._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        category: 'Transport',
        amount: 25,
        date: '2022-01-03',
      });
    expect(res.status).toBe(200);
    expect(res.body.expense.amount).toBe(25);
  });

  it('should delete an expense', async () => {
    const newExpense = await request(app)
      .post('/api/expense')
      .set('Authorization', `Bearer ${token}`)
      .send({
        category: 'Entertainment',
        amount: 75,
        date: '2022-01-04',
      });

    const res = await request(app)
      .delete(`/api/expense/${newExpense.body.expense._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.expense._id).toBe(newExpense.body.expense._id);
  });
})
