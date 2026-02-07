document.addEventListener("deviceready", onDeviceReady, false);

function onDeviceReady() {
    console.log("Device ready");
    showLogin();
}

/* =================================================
   LOGIN SCREEN
   ================================================= */
function showLogin() {
    document.getElementById("app").innerHTML = `
        <h2>EVSU Evaluation</h2>

        <input id="username" placeholder="Username" />
        <br><br>
        <input id="password" type="password" placeholder="Password" />
        <br><br>

        <button onclick="login()">Login</button>

        <p id="msg" style="color:red;"></p>

        <p style="font-size:12px;">
            Admin → admin / admin123<br>
            HR → hr / hr123
        </p>
    `;
}

/* =================================================
   AUTH LOGIC (DEFAULT ACCOUNTS)
   ================================================= */
function login() {
    const user = document.getElementById("username").value.trim();
    const pass = document.getElementById("password").value.trim();
    const msg = document.getElementById("msg");

    // DEFAULT ACCOUNTS
    if (user === "admin" && pass === "admin123") {
        localStorage.setItem("role", "admin");
        showAdminDashboard();
        return;
    }

    if (user === "hr" && pass === "hr123") {
        localStorage.setItem("role", "hr");
        showHRDashboard();
        return;
    }

    msg.textContent = "Invalid username or password";
}

/* =================================================
   ADMIN DASHBOARD
   ================================================= */
function showAdminDashboard() {
    document.getElementById("app").innerHTML = `
        <h2>Admin Dashboard</h2>
        <p>Welcome, Admin</p>

        <ul>
            <li>Manage Users</li>
            <li>View Reports</li>
            <li>System Settings</li>
        </ul>

        <button onclick="logout()">Logout</button>
    `;
}

/* =================================================
   HR DASHBOARD
   ================================================= */
function showHRDashboard() {
    document.getElementById("app").innerHTML = `
        <h2>HR Dashboard</h2>
        <p>Welcome, HR</p>

        <ul>
            <li>Employee Evaluation</li>
            <li>Attendance</li>
            <li>Reports</li>
        </ul>

        <button onclick="logout()">Logout</button>
    `;
}

/* =================================================
   LOGOUT
   ================================================= */
function logout() {
    localStorage.clear();
    showLogin();
}

/* =================================================
   CRASH PREVENTION (IMPORTANT)
   ================================================= */
window.onerror = function () {
    return true; // Prevents Cordova Application Error
};

window.addEventListener("unhandledrejection", function (e) {
    e.preventDefault();
});
