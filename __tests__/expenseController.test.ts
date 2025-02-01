import mongoose, { Connection } from "mongoose";
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
    testConnection = mongoose.createConnection(process.env.MONGO_URI as string);
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

  it('should not create an expense if no category, amount or date is provided', async () => {
    const resNoCategory = await request(app)
      .post('/api/expense')
      .set('Authorization', `Bearer ${token}`)
      .send({
        amount: 100,
        date: '2022-01-01',
      });
    expect(resNoCategory.status).toBe(400);
    expect(resNoCategory.body).toHaveProperty('error', ['"category" field is required']);

    const resNoAmount = await request(app)
      .post('/api/expense')
      .set('Authorization', `Bearer ${token}`)
      .send({
        category: 'Bill',
        date: '2022-01-01',
      });
    expect(resNoAmount.status).toBe(400);
    expect(resNoAmount.body).toHaveProperty('error', ['"amount" field is required']);

    const resNoDate = await request(app)
      .post('/api/expense')
      .set('Authorization', `Bearer ${token}`)
      .send({
        category: 'Bill',
        amount: 100,
      });
    expect(resNoDate.status).toBe(400);
    expect(resNoDate.body).toHaveProperty('error', ['"date" field is required']);
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

  it('should not get an expense if no expense found for provided ID', async () => {
    const res = await request(app)
      .get(`/api/expense/${new mongoose.Types.ObjectId()}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'Expense not found');
  });

  it('should not get an expense if provided ID is not a valid ID', async () => {
    const res = await request(app)
      .get(`/api/expense/randomId`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'Invalid ID format');
  });

  it('should get expenses by period', async () => {
    const res = await request(app)
      .get('/api/expense/period?startDate=2022-01-01&endDate=2022-12-31')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200);
    expect(res.body).toBeInstanceOf(Array);
    expect(res.body.length).toBe(3);
  });

  it('should not return expenses by period if start and end date not specified', async () => {
    const res = await request(app)
      .get('/api/expense/period')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(400);
    expect(res.body).toBeDefined();
    expect(res.body).toHaveProperty('error',  ["\"startDate\" field is required", "\"endDate\" field is required"]);
  });

  it('should not get expenses by period if invalid start or end date is provided', async () => {
    const resInvalidDate = await request(app)
      .get('/api/expense/period?startDate=2022-01-34&endDate=2022-31-12')
      .set('Authorization', `Bearer ${token}`)
    expect(resInvalidDate.status).toBe(400);
    expect(resInvalidDate.body).toHaveProperty('error', ["\"startDate\" must be in ISO 8601 date format", "\"endDate\" must be in ISO 8601 date format"]);
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

  it('should not update an expense if expense not found', async () => {
    const res = await request(app)
      .put(`/api/expense/${new mongoose.Types.ObjectId()}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        category: 'Transport',
        amount: 20,
        date: '2022-01-03',
      });
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'Expense not found');
  });

  it('should not update an expense if provided ID is not a valid ID', async () => {
    const res = await request(app)
      .put(`/api/expense/randomId`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        category: 'Transport',
        amount: 25,
        date: '2022-01-03',
      });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'Invalid ID format');
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

  it('should not delete an expense if expense not found', async () => {
    const res = await request(app)
      .delete(`/api/expense/${new mongoose.Types.ObjectId()}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'Expense not found');
  });

  it('should not delete an expense if provided ID is not a valid ID', async () => {
    const res = await request(app)
    .delete(`/api/expense/randomId`)
    .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'Invalid ID format');
  });
})
