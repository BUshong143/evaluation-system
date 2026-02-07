/* ===============================
   CONFIG
================================ */
const API_BASE = "http://127.0.0.1:8000";

/* ===============================
   AUTH UTILITIES
================================ */
function getToken() {
  return localStorage.getItem("access_token");
}

function getRole() {
  return localStorage.getItem("role");
}

function logout(force = false) {
  localStorage.clear();
  if (force) {
    alert("Session expired. Please login again.");
  }
  window.location.href = "login.html";
}

/* ===============================
   SAFE FETCH
================================ */
async function safeFetch(url, options = {}) {
  const token = getToken();

  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.headers || {})
    }
  });

  if (res.status === 401 || res.status === 403) {
    logout(true);
    throw new Error("Unauthorized");
  }

  return res;
}

/* ===============================
   AUTH GUARD (HR ONLY)
================================ */
if (!getToken() || getRole() !== "hr") {
  logout(true);
}

/* ===============================
   GLOBAL STATE
================================ */
let departments = [];

/* ===============================
   NAVIGATION
================================ */
function showSection(id) {
  document.querySelectorAll(".section").forEach(sec =>
    sec.classList.add("hidden")
  );
  document.getElementById(id).classList.remove("hidden");
}

/* ===============================
   LOAD DATA
================================ */
async function loadDepartments() {
  const res = await safeFetch(`${API_BASE}/departments`);
  departments = await res.json();
}

async function loadUsers() {
  await loadDepartments();

  const res = await safeFetch(`${API_BASE}/users`);
  const users = await res.json();

  const tbody = document.getElementById("userTable");
  tbody.innerHTML = "";

  if (!users.length) {
    tbody.innerHTML = `<tr><td colspan="4">No accounts found</td></tr>`;
    return;
  }

  users.forEach(u => {
    const deptOptions = departments.map(d =>
      `<option value="${d.id}" ${d.id === u.department_id ? "selected" : ""}>
        ${d.name}
      </option>`
    ).join("");

    tbody.innerHTML += `
      <tr>
        <td><input id="username-${u.id}" value="${u.username}"></td>
        <td>
          <select id="role-${u.id}">
            ${["admin","hr","head","user"].map(r =>
              `<option value="${r}" ${u.role === r ? "selected" : ""}>${r}</option>`
            ).join("")}
          </select>
        </td>
        <td>
          <select id="dept-${u.id}">
            <option value="">None</option>
            ${deptOptions}
          </select>
        </td>
        <td>
          <button class="primary" onclick="updateUser(${u.id})">UPDATE</button>
          <button class="danger" onclick="deleteUser(${u.id})">DELETE</button>
        </td>
      </tr>
    `;
  });
}

/* ===============================
   PASSWORD POLICY (STRICT)
================================ */
let passwordValid = false;

function checkTempPasswordStrength(password) {
  const fill = document.getElementById("tempStrengthFill");
  const text = document.getElementById("tempStrengthText");
  const input = document.getElementById("deptPassword");

  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const hasLength = password.length >= 8;

  passwordValid = hasUpper && hasLower && hasNumber && hasSpecial && hasLength;

  fill.style.width = "0%";
  fill.style.background = "#dc2626";
  input.style.borderColor = "#dc2626";

  if (!password) {
    text.textContent = "Enter a temporary password";
    input.style.borderColor = "#e5e7eb";
    passwordValid = false;
    return;
  }

  const score =
    [hasUpper, hasLower, hasNumber, hasSpecial, hasLength].filter(Boolean).length;

  fill.style.width = `${score * 20}%`;

  if (!passwordValid) {
    text.textContent =
      "Must include uppercase, lowercase, number, special character (min 8 chars)";
  } else {
    fill.style.background = "#16a34a";
    input.style.borderColor = "#16a34a";
    text.textContent = "Password meets all security requirements";
  }
}

/* ===============================
   CREATE DEPARTMENT + HEAD
================================ */
async function createDepartment() {
  const department_name = document.getElementById("deptName").value.trim();
  const username = document.getElementById("deptUsername").value.trim();
  const password = document.getElementById("deptPassword").value;

  if (!department_name || !username || !password) {
    alert("Please fill all fields");
    return;
  }

  if (!passwordValid) {
    alert(
      "Password must contain:\n" +
      "- Uppercase letter\n" +
      "- Lowercase letter\n" +
      "- Number\n" +
      "- Special character\n" +
      "- Minimum 8 characters"
    );
    return;
  }

  const res = await safeFetch(
    `${API_BASE}/departments/create-with-user`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ department_name, username, password })
    }
  );

  const data = await res.json();

  if (!res.ok && data.detail === "Department exists") {
    alert("Department already exists. Please use a different name.");
    return;
  }

  if (!res.ok) {
    alert(data.detail || "Failed to create department");
    return;
  }

  alert("Department & Head account created successfully!");

  ["deptName","deptUsername","deptPassword"].forEach(id =>
    document.getElementById(id).value = ""
  );

  passwordValid = false;
  checkTempPasswordStrength("");

  await loadUsers();        // ✅ fresh DB reload
  showSection("accounts");  // ✅ back to list
}

/* ===============================
   UPDATE USER
================================ */
async function updateUser(id) {
  const username = document.getElementById(`username-${id}`).value.trim();
  const role = document.getElementById(`role-${id}`).value;
  const department_id = document.getElementById(`dept-${id}`).value;

  if (!username) {
    alert("Username required");
    return;
  }

  const res = await safeFetch(`${API_BASE}/users/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username,
      role,
      department_id: department_id ? parseInt(department_id) : null
    })
  });

  alert(res.ok ? "Account updated" : "Update failed");
}

/* ===============================
   DELETE USER (PERMANENT)
================================ */
async function deleteUser(id) {
  if (!confirm("This will permanently delete the account. Continue?")) return;

  const res = await safeFetch(`${API_BASE}/users/${id}`, {
    method: "DELETE"
  });

  if (res.ok) {
    alert("Account permanently deleted");
    await loadUsers();   // ✅ reload from DB so recreate works
  }
}

/* ===============================
   INIT
================================ */
showSection("accounts");
loadUsers();
