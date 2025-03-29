document.addEventListener("DOMContentLoaded", async () => {
    await loadProducts();
    await setupCart();

    const sidebar = document.getElementById("sidebar");
    const openButton = document.getElementById("openSidebar");
    const closeButton = document.getElementById("closeSidebar");

    // ฟังก์ชันเปิด Sidebar
    openButton.addEventListener("click", function () {
        sidebar.style.right = "0"; // เลื่อน Sidebar เข้ามาในหน้าจอ
    });

    // ฟังก์ชันปิด Sidebar
    closeButton.addEventListener("click", function () {
        sidebar.style.right = "-300px"; // เลื่อน Sidebar ออกนอกหน้าจอ
    });
});

document.addEventListener("DOMContentLoaded", function () {
    const user = JSON.parse(localStorage.getItem("user"));

    if (user) {
        document.getElementById("userInfo").innerHTML = `
            <p>สวัสดีคุณ ${user.firstname || 'ผู้ใช้'} ${user.lastname || ''}!</p>
            <p>อีเมล: ${user.email}</p>
        `;
    } else {
        alert("กรุณาเข้าสู่ระบบก่อน");
        window.location.href = "login/login.html";
    }
});

document.getElementById("logout").addEventListener("click", function () {
    localStorage.removeItem("user");
    alert("ออกจากระบบเรียบร้อยแล้ว!");
    window.location.href = "login/login.html";
});


// 📦 โหลดสินค้าจากเซิร์ฟเวอร์
async function loadProducts() {
    try {
        const response = await fetch("http://localhost:8000/products");
        if (!response.ok) throw new Error("โหลดสินค้าล้มเหลว");

        const products = await response.json();
        const productList = document.getElementById("productList");
        productList.innerHTML = "";

        products.forEach(product => {
            const productCard = document.createElement("div");
            productCard.classList.add("product-card");
            productCard.innerHTML = `
                <img src="${product.img_url}" alt="${product.name}">
                <h3>${product.name}</h3>
                <p>${product.price} THB</p>
                <button onclick="addToCart(${product.id}, '${product.name}', ${product.price})">🛒 หยิบใส่ตะกร้า</button>
            `;
            productList.appendChild(productCard);
        });
    } catch (error) {
        console.error("เกิดข้อผิดพลาด:", error);
    }
}

// 🛒 จัดการระบบตะกร้าสินค้า
async function setupCart() {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    updateCartUI(cart);
}

// ➕ เพิ่มสินค้าไปยังตะกร้า
function addToCart(id, name, price) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    const existingProduct = cart.find(item => item.id === id);
    if (existingProduct) {
        existingProduct.quantity += 1;
    } else {
        cart.push({ id, name, price, quantity: 1 });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartUI(cart);
}

// 🔄 อัปเดต UI ของตะกร้า
function updateCartUI(cart) {
    const cartList = document.getElementById("cartList");
    const totalPriceElement = document.getElementById("totalPrice");

    if (!cartList) return;

    cartList.innerHTML = "";

    let totalPrice = 0;

    cart.forEach(item => {
        const cartItem = document.createElement("li");
        cartItem.innerHTML = `
            <span>${item.name} x${item.quantity} - ${item.price * item.quantity} THB</span>
            <button onclick="removeFromCart(${item.id})">ลบ</button>
        `;
        cartList.appendChild(cartItem);
        totalPrice += item.price * item.quantity;
    });

    totalPriceElement.textContent = totalPrice;
}

// ⏬ เลื่อนลงไปยังสินค้า
function scrollToProducts() {
    document.getElementById("productList").scrollIntoView({ behavior: "smooth" });
}

// โหลดตะกร้าจาก localStorage เมื่อหน้าเว็บโหลด
document.addEventListener("DOMContentLoaded", () => {
    loadCart();
    document.getElementById("checkoutButton").addEventListener("click", checkout);
});

// โหลดข้อมูลตะกร้าจาก localStorage
function loadCart() {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    updateCartUI(cart);
}

// ลบสินค้าจากตะกร้า
function removeFromCart(id) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    cart = cart.filter(item => item.id !== id);
    localStorage.setItem("cart", JSON.stringify(cart));
    loadCart();
}

// ฟังก์ชันชำระเงิน
async function checkout() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    if (cart.length === 0) {
        alert("ตะกร้าของคุณว่างเปล่า!");
        return;
    }

    // ตัวอย่าง user_id ที่สามารถเปลี่ยนได้ตามการเข้าสู่ระบบ
    const user_id = 1; // ในที่นี้ใช้ user_id = 1 ตัวอย่าง

    // เตรียมข้อมูลคำสั่งซื้อ
    const order = {
        user_id: user_id,
        items: cart,
        total_price: cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
    };

    // ส่งข้อมูลคำสั่งซื้อไปยังเซิร์ฟเวอร์
    const response = await fetch("http://localhost:8000/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(order)
    });

    const result = await response.json();
    alert(result.message); // ข้อความจากเซิร์ฟเวอร์

    // ล้างตะกร้าหลังจากการชำระเงิน
    localStorage.removeItem("cart");
    loadCart();
}
