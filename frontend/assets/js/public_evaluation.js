const API_BASE = "http://127.0.0.1:8000";

/* =========================
   GLOBAL STATE
========================= */
let qid = null;
let ratings = [];
let questionsLoaded = false;
let submitting = false;

/* =========================
   DOM READY
========================= */
document.addEventListener("DOMContentLoaded", () => {
  loadActiveQuestionnaire();
});

/* =========================
   LOAD ACTIVE QUESTIONNAIRE
========================= */
async function loadActiveQuestionnaire() {
  try {
    const res = await fetch(`${API_BASE}/public/active-questionnaire`);
    if (!res.ok) throw new Error();

    const data = await res.json();
    const content = JSON.parse(data.content);

    qid = data.id;
    ratings = new Array(content.questions.length).fill(0);

    renderQuestions(content.questions);
    initStarRatings();
    questionsLoaded = true;

  } catch {
    showResult("No active evaluation is available at this time.", "red");
  }
}

/* =========================
   RENDER QUESTIONS
========================= */
function renderQuestions(questions) {
  const container = document.getElementById("ratingContainer");
  container.innerHTML = "";

  questions.forEach((q, i) => {
    container.insertAdjacentHTML(
      "beforeend",
      `
      <div class="rating-block">
        <label>${q}</label>
        <div class="stars" data-index="${i}"></div>
      </div>
      `
    );
  });
}

/* =========================
   ⭐ STAR RATINGS
========================= */
function initStarRatings() {
  document.querySelectorAll(".stars").forEach(starBox => {
    const index = Number(starBox.dataset.index);
    starBox.innerHTML = "";

    for (let i = 1; i <= 5; i++) {
      const star = document.createElement("span");
      star.textContent = "★";

      star.addEventListener("click", () => {
        ratings[index] = i;
        updateStars(starBox, i);
      });

      star.addEventListener("mouseenter", () => updateStars(starBox, i));
      star.addEventListener("mouseleave", () =>
        updateStars(starBox, ratings[index])
      );

      starBox.appendChild(star);
    }
  });
}

function updateStars(container, value) {
  [...container.children].forEach((star, i) => {
    star.classList.toggle("active", i < value);
  });
}

/* =========================
   SUBMIT EVALUATION
========================= */
document
  .getElementById("evaluationForm")
  .addEventListener("submit", async e => {
    e.preventDefault();

    if (submitting) return;
    submitting = true;

    if (!questionsLoaded || !qid) {
      showResult("Evaluation is not ready.", "red");
      submitting = false;
      return;
    }

    const clientCategory = document.getElementById("client_category").value;
    const feedbackType = document.getElementById("feedback_type").value;
    const feedbackMessage = document
      .getElementById("feedback_message")
      .value.trim();

    if (!clientCategory) {
      showResult("Please select a client category.", "red");
      submitting = false;
      return;
    }

    if (ratings.some(r => r === 0)) {
      showResult("Please rate all items.", "red");
      submitting = false;
      return;
    }

    if (!feedbackType) {
      showResult("Please select a feedback type.", "red");
      submitting = false;
      return;
    }

    if (!feedbackMessage) {
      showResult("Please enter your feedback.", "red");
      submitting = false;
      return;
    }

    const now = new Date();

    const payload = {
      name: document.getElementById("name").value || null,
      date: now.toISOString().split("T")[0],
      time: now.toTimeString().slice(0, 5),
      client_category: clientCategory,
      ratings,
      feedback_type: feedbackType,
      feedback_message: feedbackMessage
    };

    try {
      const res = await fetch(`${API_BASE}/evaluations/${qid}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error();

      /* 🔒 PERMANENT LOCK ON SUCCESS */
      document
        .querySelectorAll(
          "#evaluationForm input, #evaluationForm select, #evaluationForm textarea, #evaluationForm button"
        )
        .forEach(el => (el.disabled = true));

      document.getElementById("evaluationCard").classList.add("hidden");
      document.body.classList.add("modal-open");
      document.getElementById("successBox").classList.remove("hidden");

    } catch {
      submitting = false;
      showResult("Submission failed. Please try again.", "red");
    }
  });

/* =========================
   RESULT MESSAGE
========================= */
function showResult(msg, color) {
  const r = document.getElementById("result");
  r.textContent = msg;
  r.style.color = color;
}

/* =========================
   🤖 AI CHAT (SAFE)
========================= */
const aiButton = document.getElementById("ai-button");
const aiChat = document.getElementById("ai-chat");
const aiClose = document.getElementById("ai-close");

aiButton.addEventListener("click", () =>
  aiChat.classList.remove("hidden")
);
aiClose.addEventListener("click", () =>
  aiChat.classList.add("hidden")
);

async function sendAIMessage() {
  const input = document.getElementById("ai-input");
  const messages = document.getElementById("ai-messages");
  const text = input.value.trim();
  if (!text) return;

  messages.innerHTML += `<div class="chat-bubble user">${text}</div>`;
  input.value = "";

  try {
    const res = await fetch(`${API_BASE}/public/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text })
    });

    const data = await res.json();
    messages.innerHTML += `<div class="chat-bubble bot">${data.reply}</div>`;
  } catch {
    messages.innerHTML += `<div class="chat-bubble bot">⚠️ AI unavailable</div>`;
  }

  messages.scrollTop = messages.scrollHeight;
}

/* =========================
   🔒 PERMANENT SUCCESS LOCK
   (NO EXIT, EVER)
========================= */
const successBox = document.getElementById("successBox");

const lockSuccessModal = () => {
  if (!successBox.classList.contains("hidden")) {
    document.body.classList.add("modal-open");
    successBox.classList.remove("hidden");
  }
};

/* Enforce lock continuously */
setInterval(lockSuccessModal, 500);

/* Block ESC key */
document.addEventListener("keydown", e => {
  if (!successBox.classList.contains("hidden")) {
    e.preventDefault();
    e.stopPropagation();
  }
});

/* Block clicks behind modal */
document.addEventListener("click", e => {
  if (!successBox.classList.contains("hidden")) {
    e.stopPropagation();
  }
}, true);

/* Prevent accidental reload/back */
window.addEventListener("beforeunload", e => {
  if (!successBox.classList.contains("hidden")) {
    e.preventDefault();
    return "";
  }
});
