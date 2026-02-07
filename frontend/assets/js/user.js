const API_URL = "https://evaluation-system-1.onrender.com";
const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "login.html";
}

/* LOAD EVALUATIONS */
async function loadEvaluations() {
  const res = await fetch(`${API_BASE}/evaluations`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    alert("Failed to load evaluations");
    return;
  }

  const data = await res.json();
  const container = document.getElementById("evaluationList");

  if (data.length === 0) {
    container.innerHTML = "<p>No evaluations available</p>";
    return;
  }

  container.innerHTML = data.map(q => `
    <div class="eval-card">
      <pre>${q.content}</pre>
    </div>
  `).join("");
}

/* LOGOUT */
function logout() {
  localStorage.clear();
  window.location.href = "login.html";
}

loadEvaluations();
