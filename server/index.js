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
app.use('/uploads', express.static('uploads'));

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

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

// ลงทะเบียน
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

// ล็อกอิน
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

// อัปเดตโปรไฟล์
app.post("/users/update", async (req, res) => {
  const { email, firstname, lastname, age, gender, interests, description, payment_method } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required for updating profile." });
  }

  try {
    const [userResults] = await conn.query("SELECT * FROM users WHERE email = ?", [email]);
    if (userResults.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    await conn.query(
      "UPDATE users SET firstname = ?, lastname = ?, age = ?, gender = ?, interests = ?, description = ?, payment_method = ? WHERE email = ?",
      [firstname, lastname, age, gender, interests, description, payment_method, email]
    );

    res.json({ message: "Profile updated successfully." });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong", errorMessage: error.message });
  }
});

// ดึงโปรไฟล์จาก id
app.get('/users/profile/:id', async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ message: "User ID is required" });
  }

  try {
    const [userResults] = await conn.query("SELECT * FROM users WHERE id = ?", [id]);
    if (userResults.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(userResults[0]);
  } catch (error) {
    res.status(500).json({ message: "Something went wrong", errorMessage: error.message });
  }
});

// เพิ่มสินค้า
app.post('/products', upload.single('image'), async (req, res) => {
  const { name, description, price, stock } = req.body;
  const img_url = req.file ? req.file.filename : 'default.png';

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

// ดึงสินค้าทั้งหมด
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

// สร้างคำสั่งซื้อ + แก้ไข subtotal
app.post("/orders", async (req, res) => {
  try {
    const { user_id, total_price, shipping_address, payment_method, items } = req.body;

    if (!user_id || !total_price || !shipping_address || !payment_method || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "❌ ข้อมูลไม่ครบ หรือไม่มีสินค้าในรายการ" });
    }

    const [orderResult] = await conn.query(
      `INSERT INTO orders (user_id, total_price, shipping_address, payment_method, status) 
       VALUES (?, ?, ?, ?, 'pending')`,
      [user_id, total_price, shipping_address, payment_method]
    );

    const orderId = orderResult.insertId;

    for (const item of items) {
      const { id: product_id, quantity, price } = item;
      if (!product_id || !quantity || !price) continue;

      const subtotal = quantity * price;

      await conn.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price, subtotal) 
         VALUES (?, ?, ?, ?, ?)`,
        [orderId, product_id, quantity, price, subtotal]
      );
    }

    res.status(201).json({ message: "✅ Order created with items", orderId });

  } catch (error) {
    console.error("❌ สร้างคำสั่งซื้อไม่สำเร็จ:", error);
    res.status(500).json({ message: "❌ Internal Server Error", errorMessage: error.message });
  }
});

// Users API
app.get("/api/all-users", async (req, res) => {
  try {
    const [users] = await conn.query("SELECT id, email, firstname AS first_name, lastname AS last_name FROM users");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Error fetching users", error: err.message });
  }
});

app.get("/api/search", async (req, res) => {
  const { query } = req.query;
  try {
    let results;
    if (!isNaN(query)) {
      [results] = await conn.query("SELECT * FROM users WHERE id = ?", [query]);
    } else {
      [results] = await conn.query("SELECT * FROM users WHERE email LIKE ?", [`%${query}%`]);
    }

    const users = results.map(u => ({
      id: u.id,
      email: u.email,
      first_name: u.firstname,
      last_name: u.lastname
    }));

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Search error", error: err.message });
  }
});

app.get("/api/user/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await conn.query("SELECT * FROM users WHERE id = ?", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const u = rows[0];
    res.json({
      id: u.id,
      email: u.email,
      first_name: u.firstname,
      last_name: u.lastname,
      age: u.age,
      gender: u.gender,
      interests: u.interests,
      description: u.description,
      payment_method: u.payment_method
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching user", error: err.message });
  }
});

app.put("/api/user/:id", async (req, res) => {
  const { id } = req.params;
  const { email, first_name, last_name, age, gender, interests, description, payment_method } = req.body;
  try {
    await conn.query(
      "UPDATE users SET email=?, firstname=?, lastname=?, age=?, gender=?, interests=?, description=?, payment_method=? WHERE id=?",
      [email, first_name, last_name, age, gender, interests, description, payment_method, id]
    );
    res.json({ message: "User updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error updating user", error: err.message });
  }
});

app.delete("/api/user/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await conn.query("DELETE FROM users WHERE id = ?", [id]);
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting user", error: err.message });
  }
});

app.get("/api/user/:id/orders", async (req, res) => {
  const { id } = req.params;
  try {
    const [orders] = await conn.query(
      "SELECT id, total_price AS total, status FROM orders WHERE user_id = ?",
      [id]
    );
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Error fetching orders", error: err.message });
  }
});

app.get("/api/check-role", async (req, res) => {
  const user = req.query.user_id;
  if (!user) return res.status(400).json({ message: "User ID is required" });

  try {
    const [rows] = await conn.query("SELECT role FROM users WHERE id = ?", [user]);
    if (rows.length === 0) return res.status(404).json({ message: "User not found" });

    res.json({ role: rows[0].role });
  } catch (err) {
    res.status(500).json({ message: "Error checking role", error: err.message });
  }
});

app.listen(port, async () => {
  await initMySQL();
  console.log('Server running on port ' + port);
});
