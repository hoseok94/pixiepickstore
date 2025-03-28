const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');
const cors = require('cors');
const app = express();
const port = 8000;

app.use(bodyParser.json());
app.use(cors());

// Initialize MySQL connection
let conn = null;

const initMySQL = async () => {
  conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'pixelstore_db',
    port: 8701
  });
};

// 1. ระบบบัญชีผู้ใช้ - ลงทะเบียน
app.post('/users/register', async (req, res) => {
  const { email, password, firstname, lastname } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const [userResults] = await conn.query('SELECT * FROM users WHERE email = ?', [email]);
    if (userResults.length > 0) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const [results] = await conn.query(
      'INSERT INTO users (email, password, firstname, lastname) VALUES (?, ?, ?, ?)',
      [email, password, firstname, lastname]
    );

    res.json({ message: 'User registered successfully', userId: results.insertId });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong', errorMessage: error.message });
  }
});

// 2. ระบบบัญชีผู้ใช้ - ล็อกอิน
app.post('/users/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const [userResults] = await conn.query('SELECT * FROM users WHERE email = ?', [email]);
    if (userResults.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = userResults[0];

    if (password !== user.password) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    res.json({ message: 'Login successful', user });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong', errorMessage: error.message });
  }
});

// 3. ระบบบัญชีผู้ใช้ - แก้ไขโปรไฟล์
app.put('/users/:id/profile', async (req, res) => {
  const { id } = req.params;
  const { age, gender, interests, description, payment_method } = req.body;

  if (!age || !gender || !payment_method) {
    return res.status(400).json({ message: 'Age, gender, and payment method are required' });
  }

  try {
    const [results] = await conn.query(
      'UPDATE users SET age = ?, gender = ?, interests = ?, description = ?, payment_method = ? WHERE id = ?',
      [age, gender, JSON.stringify(interests), description, payment_method, id]
    );

    res.json({ message: 'Profile updated successfully', data: results });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong', errorMessage: error.message });
  }
});

// 4. ระบบจัดการสินค้า - เพิ่มสินค้า
app.post('/products', async (req, res) => {
  const { name, description, price, stock } = req.body;

  try {
    const [results] = await conn.query(
      'INSERT INTO products (name, description, price, stock) VALUES (?, ?, ?, ?)',
      [name, description, price, stock]
    );

    res.json({ message: 'Product added successfully', productId: results.insertId });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong', errorMessage: error.message });
  }
});

// 5. ระบบตะกร้าสินค้า - เพิ่มสินค้าในตะกร้า
app.post('/cart', async (req, res) => {
  const { user_id, product_id, quantity } = req.body;

  try {
    const [results] = await conn.query(
      'INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)',
      [user_id, product_id, quantity]
    );

    res.json({ message: 'Product added to cart', cartId: results.insertId });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong', errorMessage: error.message });
  }
});

// Start the server
app.listen(port, async () => {
  await initMySQL();
  console.log('Server running on port ' + port);
});
