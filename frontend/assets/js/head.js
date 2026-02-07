const API_BASE = "https://evaluation-api.onrender.com";

/* ===============================
   🔥 FIX: CORRECT TOKEN KEY
================================ */
const token = localStorage.getItem("access_token"); // ✅ FIXED
const role = localStorage.getItem("role");

/* ===============================
   AUTH GUARD (HEAD ONLY)
================================ */
if (!token || role !== "head") {
  window.location.href = "login.html";
}

/* ===============================
   GLOBAL STATE
================================ */
let questions = [
  "Service provider’s overall treatment of you",
  "Clarity of instructions provided",
  "Timeliness of service delivery",
  "Quality of service received",
  "Service provider’s knowledge and competence"
];

/* ===============================
   SIDEBAR NAVIGATION
================================ */
function showSection(id) {
  document.querySelectorAll(".section").forEach(sec =>
    sec.classList.add("hidden")
  );
  document.getElementById(id).classList.remove("hidden");

  if (id === "responses") loadResponses();
  if (id === "questionnaires") renderQuestions();
  if (id === "links") loadQuestionnaires();
}

/* ===============================
   QUESTION CRUD
================================ */
function renderQuestions() {
  const container = document.getElementById("questionList");
  container.innerHTML = "";

  questions.forEach((q, index) => {
    container.innerHTML += `
      <div class="question-item">
        <input
          type="text"
          value="${q}"
          onchange="updateQuestion(${index}, this.value)"
        />
        <button onclick="deleteQuestion(${index})">✖</button>
      </div>
    `;
  });
}

function addQuestion() {
  questions.push("");
  renderQuestions();
}

function updateQuestion(index, value) {
  questions[index] = value;
}

function deleteQuestion(index) {
  if (!confirm("Delete this question?")) return;
  questions.splice(index, 1);
  renderQuestions();
}

/* ===============================
   🤖 AI QUESTIONNAIRE GENERATOR
================================ */
async function generateAIQuestionnaire() {
  const service = document.getElementById("service_name").value.trim();
  if (!service) return alert("Please enter the Office / Service Name.");

  if (!confirm(`Generate AI questions for "${service}"?`)) return;

  try {
    const res = await fetch(`${API_BASE}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        message:
          `Generate exactly 5 client satisfaction survey questions for "${service}". ` +
          `Return ONLY a JSON array of strings.`
      })
    });

    if (!res.ok) throw new Error();

    const data = await res.json();
    const parsed = JSON.parse(data.reply);

    if (!Array.isArray(parsed)) throw new Error();

    questions = parsed;
    renderQuestions();

  } catch {
    alert("AI failed to generate questions.");
  }
}

/* ===============================
   SAVE QUESTIONNAIRE
================================ */
async function saveQuestionnaire() {
  const service = document.getElementById("service_name").value.trim();
  if (!service) return alert("Service name is required.");

  if (questions.some(q => !q.trim())) {
    return alert("Please complete all questions.");
  }

  const content = { service, questions };

  const res = await fetch(`${API_BASE}/questionnaires`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ content: JSON.stringify(content) })
  });

  if (res.ok) {
    alert("Questionnaire saved successfully.");
    document.getElementById("service_name").value = "";
    loadQuestionnaires();
    showSection("links");
  } else {
    alert("Failed to save questionnaire.");
  }
}

/* ===============================
   LOAD QUESTIONNAIRES (STATUS)
================================ */
async function loadQuestionnaires() {
  const res = await fetch(`${API_BASE}/questionnaires`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) return;

  const data = await res.json();
  const tbody = document.getElementById("linkTable");
  tbody.innerHTML = "";

  if (!data.length) {
    tbody.innerHTML =
      `<tr><td colspan="3">No questionnaires available</td></tr>`;
    return;
  }

  data.forEach(q => {
    let label = "Client Satisfaction Questionnaire";
    let status = "Inactive";

    try {
      const parsed = JSON.parse(q.content);
      label = parsed.service || label;
    } catch {}

    if (q.is_active) status = "Active";

    tbody.innerHTML += `
      <tr>
        <td>${label}</td>
        <td>${status}</td>
        <td>
          <button
            class="primary"
            onclick="activateEvaluation(${q.id})"
            ${q.is_active ? "disabled" : ""}
          >
            ${q.is_active ? "Active" : "Send to Evaluation Intro"}
          </button>
        </td>
      </tr>
    `;
  });
}

/* ===============================
   ACTIVATE EVALUATION
================================ */
async function activateEvaluation(qid) {
  const res = await fetch(
    `${API_BASE}/questionnaires/${qid}/activate`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  if (!res.ok) {
    alert("Failed to activate evaluation.");
    return;
  }

  alert(
    "✅ Evaluation has been successfully activated.\n\n" +
    "Users may now proceed to the Evaluation Introduction page."
  );

  loadQuestionnaires();
}

/* ===============================
   LOAD RESPONSES
================================ */
async function loadResponses() {
  const res = await fetch(`${API_BASE}/head/evaluations`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const data = await res.json();
  const tbody = document.getElementById("responseTable");
  const avgBox = document.getElementById("avgRatingBox");

  tbody.innerHTML = "";
  avgBox.innerHTML = "";

  if (!data.length) {
    tbody.innerHTML =
      `<tr><td colspan="4">No responses yet</td></tr>`;
    return;
  }

  let total = 0, count = 0;

  data.forEach(r => {
    const stars = r.ratings
      .map(v => "★".repeat(v) + "☆".repeat(5 - v))
      .join("<br>");

    r.ratings.forEach(v => {
      total += v;
      count++;
    });

    tbody.innerHTML += `
      <tr>
        <td>${r.name || "Anonymous"}</td>
        <td>${r.date} ${r.time}</td>
        <td class="star">${stars}</td>
        <td>${r.feedback_message}</td>
      </tr>
    `;
  });

  avgBox.innerHTML =
    `⭐ Average Service Rating: <b>${(total / count).toFixed(2)} / 5</b>`;
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
showSection("dashboard");
loadQuestionnaires();
renderQuestions();
