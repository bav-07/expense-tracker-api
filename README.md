# Expense Tracker API

## Overview
Expense Tracker API: a RESTful service that allows users to securely manage their personal income/expenses. It provides endpoints to create, read, update, and delete income and expense records.

## Features
- User authentication and authorization (JWT)
- CRUD operations for incomes/expenses
- Categorization of incomes/expenses
- Filtering income/expenses by time period

## Getting Started

### Prerequisites
- Node.js
- npm

### Installation
1. Clone the repository:
  ```sh
  git clone https://github.com/yourusername/expense-tracker-api.git
  ```
2. Navigate to the project directory:
  ```sh
  cd expense-tracker-api
  ```
3. Install dependencies:
  ```sh
  npm install
  ```

### Configuration
Create a `.env` file in the root directory and add the following environment variables:
```
PORT=3000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
```

### Running the API
Start the server:
```sh
npm start
```
The API will be accessible at `http://localhost:3000`.

## Protection

All requests, aside from `register` and `login`, require a JSON Web Token (JWT). When making requests, first register/login, then from response's `token` field, take the provided token and put it in the Authorization Header as `Bearer {token}`, replacing `{token}` with your token. This token is set to expire after 1 hour and thus the user must log in again.

The token acts as verification, such that the API will retrieve the data corresponding to the user who's token is provided.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Authenticate a user and get a token
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/preferences` - Update user preferences

### Expenses
- `GET /api/expense` - Get all expenses
- `GET /api/expense/period` - Get all expenses within a given period
- `GET /api/expense/:id` - Get a specific expense
- `POST /api/expense` - Create a new expense
- `PUT /api/expense/:id` - Update a specific expense
- `DELETE /api/expense/:id` - Delete a specific expense

### Incomes
- `GET /api/income` - Get all incomes
- `GET /api/income/period` - Get all incomes within a given period
- `GET /api/income/:id` - Get a specific income
- `POST /api/income` - Create a new income
- `PUT /api/income/:id` - Update a specific income
- `DELETE /api/income/:id` - Delete a specific income

## License
This project is licensed under the MIT License.