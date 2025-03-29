document.addEventListener("DOMContentLoaded", async () => {
    await loadProducts();
    await setupCart();
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
    if (!cartList) return; // ป้องกัน error ถ้ายังไม่มี element นี้ใน DOM

    cartList.innerHTML = "";

    cart.forEach(item => {
        const cartItem = document.createElement("li");
        cartItem.innerText = `${item.name} x${item.quantity} - ${item.price * item.quantity} THB`;
        cartList.appendChild(cartItem);
    });
}

// ⏬ เลื่อนลงไปยังสินค้า
function scrollToProducts() {
    document.getElementById("productList").scrollIntoView({ behavior: "smooth" });
}
