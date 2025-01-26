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

  it('should create a new income', async () => {
    const res = await request(app)
      .post('/api/income')
      .set('Authorization', `Bearer ${token}`)
      .send({
        source: 'Salary',
        amount: 1000,
        date: '2022-01-01'
      });
    expect(res.status).toBe(201);
  });
})