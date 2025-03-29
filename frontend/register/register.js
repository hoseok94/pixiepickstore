document.getElementById("registerForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    const username = document.getElementById("username").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    if (!username || !email || !password) {
        alert("กรุณากรอกข้อมูลให้ครบถ้วน");
        return;
    }

    try {
        const response = await fetch("http://localhost:8000/users/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ username, email, password }),
        });

        const result = await response.json();

        if (response.ok) {
            alert("ลงทะเบียนสำเร็จ! กรุณาเข้าสู่ระบบ.");
            window.location.href = "../login/login.html";
        } else {
            alert(result.message || "ลงทะเบียนไม่สำเร็จ กรุณาลองใหม่อีกครั้ง.");
        }
    } catch (error) {
        console.error("Error:", error);
        alert("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    }
});

