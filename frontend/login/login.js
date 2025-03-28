document.getElementById("loginForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const response = await fetch("http://localhost:8000/users/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
    });

    const result = await response.json();

    if (response.ok) {
        alert("Login successful!");
        localStorage.setItem("user", JSON.stringify(result.user)); // เก็บข้อมูลผู้ใช้ใน localStorage
        window.location.href = "dashboard.html"; // ไปที่หน้า Dashboard หรือหน้าหลักหลังล็อกอิน
    } else {
        alert(result.message || "Login failed, please try again.");
    }
});
