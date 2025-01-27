import mongoose, { Connection } from "mongoose";
import request from "supertest";
import app from "../src/index";

describe('Income Controller Tests', () => {
  const testUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123'
  };
  
  let token: string;
  let testConnection: Connection;

  beforeAll(async () => {
    testConnection = mongoose.createConnection(process.env.TEST_MONGO_URI as string);
    await mongoose.connection.db?.dropDatabase();

    const res = await request(app)
      .post('/api/users/register')
      .send(testUser);
    token = res.body.token;
  });

  afterAll(async () => {
    await mongoose.connection.db?.dropDatabase();
    await testConnection.close();
    await mongoose.connection.close();
  });

  it('should create a new income with specified frequency', async () => {
    const res = await request(app)
      .post('/api/income')
      .set('Authorization', `Bearer ${token}`)
      .send({
        source: 'Salary',
        amount: 1000,
        date: '2022-01-01',
        frequency: 'monthly'
      });
    expect(res.status).toBe(201);
  });

  it('should create a new income with no specified frequency', async () => {
    const res = await request(app)
      .post('/api/income')
      .set('Authorization', `Bearer ${token}`)
      .send({
        source: 'Present',
        amount: 2000,
        date: '2022-02-01',
      });
    expect(res.status).toBe(201);
  });

  it('should not create a new income if no source, amount or date specified', async () => {
    const resNoDate = await request(app)
      .post('/api/income')
      .set('Authorization', `Bearer ${token}`)
      .send({
        source: 'Salary',
        amount: 1000
      });
    expect(resNoDate.status).toBe(400);
    expect(resNoDate.body).toHaveProperty('error', 'Source, amount and date are required');

    const resNoAmount = await request(app)
      .post('/api/income')
      .set('Authorization', `Bearer ${token}`)
      .send({
        source: 'Salary',
        date: '2022-02-01'
      });
    expect(resNoAmount.status).toBe(400);
    expect(resNoAmount.body).toHaveProperty('error', 'Source, amount and date are required');

    const resNoSource = await request(app)
      .post('/api/income')
      .set('Authorization', `Bearer ${token}`)
      .send({
        amount: 1000,
        date: '2022-02-01'
      });
    expect(resNoSource.status).toBe(400);
    expect(resNoSource.body).toHaveProperty('error', 'Source, amount and date are required');
  });

  it('should not create a new income if specified frequency is not weekly/monthly', async () => {
    const res = await request(app)
      .post('/api/income')
      .set('Authorization', `Bearer ${token}`)
      .send({
        source: 'Present',
        amount: 2000,
        date: '2022-02-01',
        frequency: 'yearly'
      });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'Invalid frequency. Use either "monthly" or "weekly"');
  });
  
  it('should not create a new income if token is invalid', async () => {
    const res = await request(app)
      .post('/api/income')
      .set('Authorization', `Bearer invalidToken`)
      .send({
        source: 'Present',
        amount: 2000,
        date: '2022-02-01',
      });
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error', 'Invalid token');
  });

  it('should get all incomes', async () => {
    const addedIncomeRes = await request(app)
      .post('/api/income')
      .set('Authorization', `Bearer ${token}`)
      .send({
        source: 'Salary',
        amount: 1000,
        date: '2022-03-01',
        frequency: 'monthly'
      });

    const res = await request(app)
      .get('/api/income')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.incomes).toBeDefined();
    expect(res.body.incomes.length).toBe(3);
    expect(res.body.incomes[2]._id).toBe(addedIncomeRes.body.income._id);
  });

  it('should get an income by ID', async () => {
    const newIncomeResponse = await request(app)
      .post('/api/income')
      .set('Authorization', `Bearer ${token}`)
      .send({
        source: 'Salary',
        amount: 1000,
        date: '2022-04-01',
        frequency: 'monthly'
      });

    const res = await request(app)
      .get(`/api/income/${newIncomeResponse.body.income._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.income).toBeDefined();
    expect(res.body.income._id).toBe(newIncomeResponse.body.income._id);
  });

  it('should not get an income if no income found for provided ID', async () => {
    const res = await request(app)
      .get(`/api/income/${new mongoose.Types.ObjectId()}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'Income not found');
  });

  it('should not get an income if provided ID is not a valid ID', async () => {
    const res = await request(app)
      .get(`/api/income/randomId`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error', 'Failed to retrieve income');
  });

  it('should get incomes by period', async () => {
    const res = await request(app)
      .get('/api/income/period')
      .set('Authorization', `Bearer ${token}`)
      .send({
        startDate: '2022-01-01',
        endDate: '2022-03-01'
      });
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(3);

    const resShorterPeriod = await request(app)
      .get('/api/income/period')
      .set('Authorization', `Bearer ${token}`)
      .send({
        startDate: '2022-01-01',
        endDate: '2022-02-01'
      });
    expect(resShorterPeriod.status).toBe(200);
    expect(resShorterPeriod.body.length).toBe(2);

    const resEvenShorterPeriod = await request(app)
      .get('/api/income/period')
      .set('Authorization', `Bearer ${token}`)
      .send({
        startDate: '2022-01-01',
        endDate: '2022-01-31'
      });
    expect(resEvenShorterPeriod.status).toBe(200);
    expect(resEvenShorterPeriod.body.length).toBe(1);
  });

  it('should return empty array if no incomes in specified period', async () => {
    const resEvenShorterPeriod = await request(app)
      .get('/api/income/period')
      .set('Authorization', `Bearer ${token}`)
      .send({
        startDate: '2021-12-01',
        endDate: '2021-12-31'
      });
    expect(resEvenShorterPeriod.status).toBe(200);
    expect(resEvenShorterPeriod.body).toBeDefined();
    expect(resEvenShorterPeriod.body.length).toBe(0);
  });

  it('should not return incomes in period if start and end date not specified', async () => {
    const resEvenShorterPeriod = await request(app)
      .get('/api/income/period')
      .set('Authorization', `Bearer ${token}`)
    expect(resEvenShorterPeriod.status).toBe(400);
    expect(resEvenShorterPeriod.body).toBeDefined();
    expect(resEvenShorterPeriod.body).toHaveProperty('error', 'Missing required query parameters: startDate, endDate');
  });

  it('should not return incomes in period if start and end date are in invalid format', async () => {
    const resEvenShorterPeriod = await request(app)
      .get('/api/income/period')
      .set('Authorization', `Bearer ${token}`)
      .send({
        startDate: 'January 1st, 2022',
        endDate: 'January 31st, 2022'
      });
    expect(resEvenShorterPeriod.status).toBe(400);
    expect(resEvenShorterPeriod.body).toBeDefined();
    expect(resEvenShorterPeriod.body).toHaveProperty('error', 'Invalid date format. Use YYYY-MM-DD');
  });

  it('should update an income', async () => {
    const newIncomeResponse = await request(app)
      .post('/api/income')
      .set('Authorization', `Bearer ${token}`)
      .send({
        source: 'Salary',
        amount: 1000,
        date: '2022-04-01',
        frequency: 'monthly'
      });

    const res = await request(app)
      .put(`/api/income/${newIncomeResponse.body.income._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        source: 'Updated Salary',
        amount: 1500,
        date: '2022-04-11',
        frequency: 'weekly'
      });
    expect(res.status).toBe(200);
    expect(res.body.income).toBeDefined();
    expect(res.body.income.source).toBe('Updated Salary');
    expect(res.body.income.amount).toBe(1500);
    expect(res.body.income.date).toBe('2022-04-11T00:00:00.000Z');
    expect(res.body.income.frequency).toBe('weekly');
  });

  it('should not update an income if no source, amount, date or frequency specified', async () => {
    const newIncomeResponse = await request(app)
      .post('/api/income')
      .set('Authorization', `Bearer ${token}`)
      .send({
        source: 'Salary',
        amount: 1000,
        date: '2022-04-01',
        frequency: 'monthly'
      });

    const resNoSource = await request(app)
      .put(`/api/income/${newIncomeResponse.body.income._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        amount: 1500,
        date: '2022-04-01',
        frequency: 'weekly'
      });
    expect(resNoSource.status).toBe(400);
    expect(resNoSource.body).toHaveProperty('error', 'All fields are required');

    const resNoAmount = await request(app)
      .put(`/api/income/${newIncomeResponse.body.income._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        source: 'Updated Salary',
        date: '2022-04-01',
        frequency: 'weekly'
      });
    expect(resNoAmount.status).toBe(400);
    expect(resNoAmount.body).toHaveProperty('error', 'All fields are required');

    const resNoDate = await request(app)
      .put(`/api/income/${newIncomeResponse.body.income._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        source: 'Updated Salary',
        amount: 1500,
        frequency: 'weekly'
      });
    expect(resNoDate.status).toBe(400);
    expect(resNoDate.body).toHaveProperty('error', 'All fields are required');
  });

  it('should not update an income if income not found', async () => {
    const res = await request(app)
      .put(`/api/income/${new mongoose.Types.ObjectId()}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        source: 'Updated Salary',
        amount: 1500,
        date: '2022-04-01',
        frequency: 'weekly'
      });
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'Income not found');
  });

  it('should delete an income', async () => {
    const newIncomeResponse = await request(app)
      .post('/api/income')
      .set('Authorization', `Bearer ${token}`)
      .send({
        source: 'Salary',
        amount: 1000,
        date: '2022-04-01',
        frequency: 'monthly'
      });

    const res = await request(app)
      .delete(`/api/income/${newIncomeResponse.body.income._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.income).toBeDefined();
    expect(res.body.income._id).toBe(newIncomeResponse.body.income._id);
  });

  it('should not delete an income if income not found', async () => {
    const res = await request(app)
      .delete(`/api/income/${new mongoose.Types.ObjectId()}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'Income not found');
  });
})