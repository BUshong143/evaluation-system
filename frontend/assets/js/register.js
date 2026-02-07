const API_URL = "https://evaluation-system-1.onrender.com";
let passwordScore = 0;

/* ===============================
   PASSWORD STRENGTH CHECK
================================ */
function checkPasswordStrength(password) {
  const fill = document.getElementById("strengthFill");
  const text = document.getElementById("strengthText");

  passwordScore = 0;

  if (password.length >= 8) passwordScore++;
  if (/[A-Z]/.test(password)) passwordScore++;
  if (/[0-9]/.test(password)) passwordScore++;
  if (/[^A-Za-z0-9]/.test(password)) passwordScore++;

  fill.style.width = "0%";
  fill.style.background = "#dc2626";
  text.className = "strength-text strength-weak";

  if (password.length < 6) {
    fill.style.width = "15%";
    text.textContent = "❌ Too Weak (min 8 characters)";
  }
  else if (passwordScore === 1) {
    fill.style.width = "35%";
    text.textContent = "⚠️ Weak (add numbers or uppercase)";
  }
  else if (passwordScore === 2) {
    fill.style.width = "65%";
    fill.style.background = "#f59e0b";
    text.className = "strength-text strength-medium";
    text.textContent = "✅ Strong (add symbols for extra security)";
  }
  else {
    fill.style.width = "100%";
    fill.style.background = "#16a34a";
    text.className = "strength-text strength-strong";
    text.textContent = "🔒 Very Strong password";
  }
}

/* ===============================
   REGISTER FUNCTION
================================ */
async function register() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const department = document.getElementById("department").value;

  if (!username || !password || !department) {
    alert("All fields are required.");
    return;
  }

  if (passwordScore < 2) {
    alert("Password is too weak. Please choose a stronger password.");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, department })
    });

    if (!res.ok) {
      alert("Registration failed. Username may already exist.");
      return;
    }

    alert("✅ Account created successfully. You may now login.");
    window.location.href = "login.html";

  } catch (err) {
    console.error(err);
    alert("Server not reachable.");
  }
}
