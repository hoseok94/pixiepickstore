const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const app = express();
const port = 8000;

app.use(bodyParser.json());
app.use(cors());
app.use('/uploads', express.static('uploads')); // ให้โฟลเดอร์ uploads สามารถเข้าถึงได้จากเว็บ

// ตั้งค่าการอัปโหลดไฟล์
const storage = multer.diskStorage({
  destination: 'uploads/', // เก็บไฟล์ในโฟลเดอร์ uploads
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // ตั้งชื่อไฟล์ใหม่ไม่ให้ซ้ำ
  }
});
const upload = multer({ storage });

// เชื่อมต่อฐานข้อมูล
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

// 🚀 API ลงทะเบียน
app.post("/users/register", async (req, res) => {
  const { email, password, firstname, lastname } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const [userResults] = await conn.query("SELECT * FROM users WHERE email = ?", [email]);

    if (userResults.length > 0) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const [results] = await conn.query(
      "INSERT INTO users (email, password, firstname, lastname) VALUES (?, ?, ?, ?)",
      [email, password, firstname, lastname]
    );

    res.json({ message: "User registered successfully", userId: results.insertId });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong", errorMessage: error.message });
  }
});

// 🚀 API ล็อกอิน
app.post("/users/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const [userResults] = await conn.query("SELECT * FROM users WHERE email = ?", [email]);

    if (userResults.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = userResults[0];

    if (password !== user.password) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    res.json({ message: "Login successful", user });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong", errorMessage: error.message });
  }
});

// 🚀 API เพิ่มสินค้า
app.post('/products', upload.single('image'), async (req, res) => {
  const { name, description, price, stock } = req.body;
  const img_url = req.file ? req.file.filename : 'default.png'; // ถ้าไม่มีรูป ใช้ default.png

  try {
    const [results] = await conn.query(
      'INSERT INTO products (name, description, price, stock, img_url) VALUES (?, ?, ?, ?, ?)',
      [name, description, price, stock, img_url]
    );

    res.json({ message: 'Product added successfully', productId: results.insertId, img_url });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong', errorMessage: error.message });
  }
});

// 🚀 API ดึงสินค้าทั้งหมด
app.get('/products', async (req, res) => {
  try {
    const [products] = await conn.query('SELECT id, name, description, price, stock, img_url FROM products');

    const productsWithImages = products.map(product => ({
      ...product,
      img_url: `http://localhost:8000/uploads/${product.img_url}`
    }));

    res.json(productsWithImages);
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong', errorMessage: error.message });
  }
});

// 🚀 API สร้างคำสั่งซื้อ
app.post("/orders", async (req, res) => {
  const { user_id, items, total_price } = req.body;

  if (!user_id || !items || !total_price) {
    return res.status(400).json({ message: "user_id, items, and total_price are required" });
  }

  try {
    // สร้างคำสั่งซื้อ
    const [orderResults] = await conn.query(
      "INSERT INTO orders (user_id, total_price, status) VALUES (?, ?, ?)",
      [user_id, total_price, 'pending']
    );

    // บันทึกสินค้าที่อยู่ในคำสั่งซื้อ
    const orderId = orderResults.insertId;

    const orderItems = items.map(item => [
      orderId, item.id, item.quantity, item.price
    ]);

    await conn.query(
      "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ?",
      [orderItems]
    );

    res.json({ message: "Order created successfully" });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong", errorMessage: error.message });
  }
});

// 🚀 Start Server
app.listen(port, async () => {
  await initMySQL();
  console.log('Server running on port ' + port);
});
