const form = document.getElementById("feedback-form");
const statusEl = document.getElementById("feedback-status");
const pulseTotal = document.getElementById("pulse-total");
const pulseFollowup = document.getElementById("pulse-followup");
const pulseLast = document.getElementById("pulse-last");
const pulseStages = document.getElementById("pulse-stages");
const pulseFocus = document.getElementById("pulse-focus");
const pulseStatus = document.getElementById("pulse-status");

if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    statusEl.textContent = "Sending feedback...";

    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    payload.contact_ok = formData.get("contact_ok") === "on";

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || "Request failed");
      }

      form.reset();
      statusEl.textContent =
        "Thanks! Feedback saved for the rubric sprint lead.";
    } catch (error) {
      statusEl.textContent = error.message || "Could not save feedback.";
    }
  });
}

const labelMaps = {
  stage: {
    prep: "Prep & onboarding",
    scoring: "Active scoring",
    decision: "Decision meeting",
    post: "Post-cycle review",
  },
  focus: {
    clarity: "Rubric clarity",
    bias: "Bias interruption",
    evidence: "Evidence gaps",
    calibration: "Calibration drift",
    workflow: "Workflow friction",
  },
};

function formatDate(value) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function renderList(el, data, map) {
  if (!el) return;
  el.innerHTML = "";
  const entries = Object.entries(data || {});
  if (!entries.length) {
    const item = document.createElement("li");
    item.textContent = "No submissions yet.";
    el.appendChild(item);
    return;
  }
  entries
    .sort((a, b) => b[1] - a[1])
    .forEach(([key, value]) => {
      const item = document.createElement("li");
      const label = map[key] || key;
      item.innerHTML = `<span>${label}</span><strong>${value}</strong>`;
      el.appendChild(item);
    });
}

async function loadPulseSummary() {
  if (!pulseStatus) return;
  pulseStatus.textContent = "Syncing with database...";
  try {
    const response = await fetch("/api/feedback-summary");
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result.error || "Unable to load pulse data.");
    }

    if (pulseTotal) pulseTotal.textContent = result.total ?? "0";
    if (pulseFollowup) pulseFollowup.textContent = result.followup ?? "0";
    if (pulseLast) pulseLast.textContent = formatDate(result.last_submission);

    renderList(pulseStages, result.stages, labelMaps.stage);
    renderList(pulseFocus, result.focus, labelMaps.focus);
    pulseStatus.textContent = "Updated from rubric feedback database.";
  } catch (error) {
    if (pulseStatus) {
      pulseStatus.textContent = error.message || "Could not load pulse data.";
    }
  }
}

loadPulseSummary();
