const API_BASE = "http://127.0.0.1:8000";
let isLoggingIn = false;

/* ==========================
   LOGIN FUNCTION (ANTI-LOGOUT FIX)
========================== */
async function login() {
  if (isLoggingIn) return;   // 🔒 prevent double call
  isLoggingIn = true;

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const error = document.getElementById("error");

  error.textContent = "";

  if (!username || !password) {
    error.textContent = "Please enter username and password";
    isLoggingIn = false;
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    if (!res.ok) {
      error.textContent = "Invalid username or password";
      isLoggingIn = false;
      return;
    }

    const data = await res.json();

    /* ✅ STORE TOKEN */
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("role", data.role);
    localStorage.setItem("department_id", data.department_id ?? "");

    /* ⏳ WAIT FOR STORAGE */
    setTimeout(() => {
      if (data.role === "admin") location.href = "admin.html";
      else if (data.role === "hr") location.href = "hr.html";
      else if (data.role === "head") location.href = "head.html";
      else location.href = "user.html";
    }, 150);

  } catch (err) {
    console.error(err);
    error.textContent = "Cannot connect to server";
    isLoggingIn = false;
  }
}