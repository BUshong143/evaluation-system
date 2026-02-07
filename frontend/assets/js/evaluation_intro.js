const API_BASE = "https://evaluation-api.onrender.com";

/* =========================
   GLOBAL STATE
========================= */
let evaluationAvailable = false;

/* =========================
   CHECK ACTIVE EVALUATION
========================= */
document.addEventListener("DOMContentLoaded", checkActiveEvaluation);

async function checkActiveEvaluation() {
  const statusEl = document.getElementById("introMessage");
  const startBtn = document.getElementById("startBtn");

  try {
    const res = await fetch(`${API_BASE}/public/active-questionnaire`);
    if (!res.ok) throw new Error();

    const data = await res.json();
    const content = JSON.parse(data.content);

    // Fill UI
    document.getElementById("serviceName").textContent =
      content.service || "Client Satisfaction Evaluation";

    statusEl.textContent =
      "This evaluation is currently active. Click the button below to begin.";

    startBtn.disabled = false;
    evaluationAvailable = true;

  } catch {
    statusEl.textContent =
      "There is currently no active evaluation available.";

    startBtn.disabled = true;
    evaluationAvailable = false;
  }
}

/* =========================
   START EVALUATION
========================= */
function startEvaluation() {
  if (!evaluationAvailable) return;

  // IMPORTANT: NO QID, NO LINK PARAMS
  window.location.href = "public_evaluation.html";
}
