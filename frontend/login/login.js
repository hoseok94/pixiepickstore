document.getElementById("loginForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        const response = await fetch("http://localhost:8000/users/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
        });

        const result = await response.json();

        if (response.ok) {
            alert("เข้าสู่ระบบสำเร็จ!");
            localStorage.setItem("user", JSON.stringify(result.user)); // บันทึกข้อมูลผู้ใช้ใน localStorage
            window.location.href = "../homepage.html"; // ย้ายไปยังหน้า homepage
        } else {
            alert(result.message || "เข้าสู่ระบบล้มเหลว กรุณาลองใหม่อีกครั้ง");
        }
    } catch (error) {
        console.error("เกิดข้อผิดพลาด:", error);
        alert("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
    }
});
