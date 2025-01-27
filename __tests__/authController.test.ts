import mongoose, { Connection } from 'mongoose';
import request from 'supertest';
import app from '../src/index'; // Import your Express app

describe('Auth Controller Tests', () => {
  // Dummy user for testing
  const testUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
  };
  
  let token: string; // To store the JWT token
  let testConnection: Connection;  
  
  beforeAll(async () => {
    // Connect to the test database
    testConnection = mongoose.createConnection(process.env.TEST_MONGO_URI as string);
    await mongoose.connection.db?.dropDatabase();
  });

  afterAll(async () => {
    // Drop the database and close the connection after tests
    await mongoose.connection.db?.dropDatabase();
    await testConnection.close();
    await mongoose.connection.close();
  });

  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/users/register')
      .send(testUser);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token'); // Ensure token is returned
    token = res.body.token; // Save the token for future tests
  });

  it('should require all fields to register', async () => {
    const resNoPassword = await request(app)
      .post('/api/users/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
      });
    expect(resNoPassword.status).toBe(400); 
    expect(resNoPassword.body).toHaveProperty('error', 'All fields are required');

    const resNoEmail = await request(app)
      .post('/api/users/register')
      .send({
        name: 'Test User',
        password: 'password123',
      });
    expect(resNoEmail.status).toBe(400); 
    expect(resNoEmail.body).toHaveProperty('error', 'All fields are required');

    const resNoName = await request(app)
      .post('/api/users/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
      });
    expect(resNoName.status).toBe(400); 
    expect(resNoName.body).toHaveProperty('error', 'All fields are required');
  });

  it('should prevent duplicate registration', async () => {
    const res = await request(app)
      .post('/api/users/register')
      .send(testUser);

    expect(res.status).toBe(400); // Conflict or bad request for duplicate email
    expect(res.body).toHaveProperty('error', 'User already exists');
  });

  it('should log in the registered user', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token'); // Ensure token is returned
    token = res.body.token; // Update the token for profile tests
  });

  it('should require all fields to login', async () => {
    const resNoPassword = await request(app)
      .post('/api/users/login')
      .send({
        email: testUser.email,
      });
    expect(resNoPassword.status).toBe(400); // Unauthorized
    expect(resNoPassword.body).toHaveProperty('error', 'All fields are required');

    const resNoEmail = await request(app)
      .post('/api/users/login')
      .send({
        password: testUser.password,
      });
    expect(resNoEmail.status).toBe(400); // Unauthorized
    expect(resNoEmail.body).toHaveProperty('error', 'All fields are required');
  });
  
  it('should not log in with invalid credentials', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({
        email: testUser.email,
        password: 'wrongpassword',
      });

    expect(res.status).toBe(401); // Unauthorized
    expect(res.body).toHaveProperty('error', 'Invalid email or password');
  });

  it('should fetch the user profile with a valid token', async () => {
    const res = await request(app)
      .get('/api/users/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('name', testUser.name);
    expect(res.body).toHaveProperty('email', testUser.email);
  });

  it('should not fetch the user profile with an invalid token', async () => {
    const res = await request(app)
      .get('/api/users/profile')
      .set('Authorization', 'Bearer invalidToken');

    expect(res.status).toBe(401); // Unauthorized
    expect(res.body).toHaveProperty('error', 'Invalid token');
  });

  it('should not fetch the user profile without a token', async () => {
    const res = await request(app).get('/api/users/profile');

    expect(res.status).toBe(401); // Unauthorized
    expect(res.body).toHaveProperty('error', 'Not authorized to access this route');
  });

  it('should update user preferences', async () => {
    const preferences = {
      weekStart: 'Monday',
      monthStart: '1',
    };

    const res = await request(app)
      .put('/api/users/preferences')
      .set('Authorization', `Bearer ${token}`)
      .send(preferences);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('weekStart', preferences.weekStart);
    expect(res.body).toHaveProperty('monthStart', preferences.monthStart);
  });

  it('should not update preferences without a token', async () => {
    const preferences = {
      weekStart: 'Monday',
      monthStart: 1,
    };

    const res = await request(app)
      .put('/api/users/preferences')
      .send(preferences);

    expect(res.status).toBe(401); // Unauthorized
    expect(res.body).toHaveProperty('error', 'Not authorized to access this route');
  });

  it('should not update preferences with an invalid token', async () => {
    const preferences = {
      weekStart: 'Monday',
      monthStart: '1',
    };

    const res = await request(app)
      .put('/api/users/preferences')
      .set('Authorization', 'Bearer invalidToken')
      .send(preferences);

    expect(res.status).toBe(401); // Unauthorized
    expect(res.body).toHaveProperty('error', 'Invalid token');
  });
});
