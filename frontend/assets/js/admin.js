const API_URL = "https://evaluation-system-1.onrender.com";
/* ===============================
   AUTH UTILITIES (FIXED)
================================ */
function getToken() {
  return localStorage.getItem("access_token");
}

function authHeaders(extra = {}) {
  const token = getToken();
  if (!token) {
    window.location.href = "login.html";
    return {};
  }
  return {
    Authorization: `Bearer ${token}`,
    ...extra
  };
}

const role = localStorage.getItem("role");

/* ===============================
   AUTH GUARD (ADMIN ONLY)
================================ */
if (!getToken() || role !== "admin") {
  window.location.href = "login.html";
}

/* ===============================
   SIDEBAR NAVIGATION
================================ */
function showSection(sectionId) {
  document.querySelectorAll(".section").forEach(sec =>
    sec.classList.add("hidden")
  );

  const target = document.getElementById(sectionId);
  if (target) target.classList.remove("hidden");

  switch (sectionId) {
    case "dashboard":
      loadDashboardStats();
      break;
    case "users":
      loadUsers();
      break;
    case "departments":
      loadDepartments();
      break;
  }
}

/* ===============================
   SYSTEM OVERVIEW
================================ */
async function loadDashboardStats() {
  try {
    // Backend may not have /admin/overview → fallback safe
    const resUsers = await fetch(`${API_BASE}/users`, {
      headers: authHeaders()
    });

    const resDepartments = await fetch(`${API_BASE}/departments`, {
      headers: authHeaders()
    });

    if (!resUsers.ok || !resDepartments.ok) {
      setDashboardFallback();
      return;
    }

    const users = await resUsers.json();
    const departments = await resDepartments.json();

    document.getElementById("totalUsers").innerText = users.length;
    document.getElementById("totalDepartments").innerText = departments.length;
    document.getElementById("totalQuestionnaires").innerText = "—";

  } catch (err) {
    console.error("Dashboard error:", err);
    setDashboardFallback();
  }
}

function setDashboardFallback() {
  document.getElementById("totalUsers").innerText = "0";
  document.getElementById("totalDepartments").innerText = "0";
  document.getElementById("totalQuestionnaires").innerText = "0";
}

/* ===============================
   USER MANAGEMENT
================================ */
async function loadUsers() {
  const tbody = document.getElementById("userTable");
  tbody.innerHTML = "";

  try {
    const res = await fetch(`${API_BASE}/users`, {
      headers: authHeaders()
    });

    if (!res.ok) throw new Error(res.status);

    const users = await res.json();

    if (!users.length) {
      tbody.innerHTML = `<tr><td colspan="3">No users found</td></tr>`;
      return;
    }

    users.forEach(u => {
      tbody.innerHTML += `
        <tr>
          <td>${u.username}</td>
          <td>${u.role}</td>
          <td>${u.is_active === false ? "Disabled" : "Active"}</td>
        </tr>
      `;
    });

  } catch (err) {
    console.error("Load users error:", err);
    tbody.innerHTML = `<tr><td colspan="3">Failed to load users</td></tr>`;
  }
}

/* ===============================
   DEPARTMENTS
================================ */
async function loadDepartments() {
  const tbody = document.getElementById("departmentTable");
  tbody.innerHTML = "";

  try {
    const res = await fetch(`${API_BASE}/departments`, {
      headers: authHeaders()
    });

    if (!res.ok) throw new Error(res.status);

    const departments = await res.json();

    if (!departments.length) {
      tbody.innerHTML = `<tr><td colspan="3">No departments found</td></tr>`;
      return;
    }

    departments.forEach(d => {
      tbody.innerHTML += `
        <tr>
          <td>${d.name}</td>
          <td>${d.head_name || "Unassigned"}</td>
          <td>
            <button class="primary" onclick="assignDepartmentHead(${d.id})">
              Edit Role
            </button>
            <button onclick="removeDepartmentHead(${d.id})">
              Remove
            </button>
            <button class="danger" onclick="deleteDepartment(${d.id})">
              Delete
            </button>
          </td>
        </tr>
      `;
    });

  } catch (err) {
    console.error("Load departments error:", err);
    tbody.innerHTML =
      `<tr><td colspan="3">Failed to load departments</td></tr>`;
  }
}

/* ===============================
   CREATE DEPARTMENT
================================ */
async function createDepartment() {
  const input = document.getElementById("deptName");
  const name = input.value.trim();

  if (!name) {
    alert("Department name is required");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/departments`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ name })
    });

    if (!res.ok) throw new Error(res.status);

    input.value = "";
    loadDepartments();
    loadDashboardStats();

  } catch (err) {
    console.error("Create department failed:", err);
    alert("Failed to create department");
  }
}

/* ===============================
   ASSIGN / REMOVE HEAD
================================ */
async function assignDepartmentHead(deptId) {
  const username = prompt("Enter HEAD username:");
  if (!username) return;

  try {
    const res = await fetch(
      `${API_BASE}/departments/${deptId}/assign-head`,
      {
        method: "PUT",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ username })
      }
    );

    if (!res.ok) throw new Error(res.status);
    loadDepartments();

  } catch {
    alert("Failed to assign department head");
  }
}

async function removeDepartmentHead(deptId) {
  if (!confirm("Remove department head?")) return;

  try {
    const res = await fetch(
      `${API_BASE}/departments/${deptId}/remove-head`,
      {
        method: "PUT",
        headers: authHeaders()
      }
    );

    if (!res.ok) throw new Error(res.status);
    loadDepartments();

  } catch {
    alert("Failed to remove department head");
  }
}

/* ===============================
   DELETE DEPARTMENT
================================ */
async function deleteDepartment(deptId) {
  if (!confirm("Delete this department permanently?")) return;

  try {
    const res = await fetch(
      `${API_BASE}/departments/${deptId}`,
      {
        method: "DELETE",
        headers: authHeaders()
      }
    );

    if (!res.ok) throw new Error(res.status);

    loadDepartments();
    loadDashboardStats();

  } catch {
    alert("Failed to delete department");
  }
}

/* ===============================
   SYSTEM SETTINGS (UI ONLY)
================================ */
function saveSettings() {
  const status = document.getElementById("evaluationStatus").value;
  alert(`Evaluation system is now "${status.toUpperCase()}"`);
}

/* ===============================
   LOGOUT
================================ */
function logout() {
  localStorage.clear();
  window.location.href = "login.html";
}

/* ===============================
   INITIAL LOAD
================================ */
document.addEventListener("DOMContentLoaded", () => {
  showSection("dashboard");
});
