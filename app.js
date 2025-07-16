const form = document.getElementById("feedback-form");
const statusEl = document.getElementById("feedback-status");
const pulseTotal = document.getElementById("pulse-total");
const pulseFollowup = document.getElementById("pulse-followup");
const pulseLast = document.getElementById("pulse-last");
const pulseStages = document.getElementById("pulse-stages");
const pulseFocus = document.getElementById("pulse-focus");
const pulseRoles = document.getElementById("pulse-roles");
const pulseStatus = document.getElementById("pulse-status");
const pulseRecent = document.getElementById("pulse-recent");
const pulseRecentStatus = document.getElementById("pulse-recent-status");
const pulseFollowupList = document.getElementById("pulse-followup-list");
const pulseFollowupStatus = document.getElementById("pulse-followup-status");
const pulseHotspots = document.getElementById("pulse-hotspots");
const pulseHotspotsStatus = document.getElementById("pulse-hotspots-status");
const pulseTrendTotal = document.getElementById("pulse-trend-total");
const pulseTrendPeak = document.getElementById("pulse-trend-peak");
const pulseTrendChart = document.getElementById("pulse-trend-chart");
const pulseTrendStatus = document.getElementById("pulse-trend-status");
const pulseTrendFocus = document.getElementById("pulse-trend-focus");
const pulseTrendStage = document.getElementById("pulse-trend-stage");
const capacityForm = document.getElementById("capacity-form");
const capacityFormStatus = document.getElementById("capacity-form-status");
const capacityAverage = document.getElementById("capacity-average");
const capacityHours = document.getElementById("capacity-hours");
const capacityRisk = document.getElementById("capacity-risk");
const capacityRiskList = document.getElementById("capacity-risk-list");
const capacityRecent = document.getElementById("capacity-recent");
const capacityRecentStatus = document.getElementById("capacity-recent-status");
const capacityStatus = document.getElementById("capacity-status");
const actionForm = document.getElementById("action-form");
const actionStatus = document.getElementById("action-status");
const actionList = document.getElementById("action-list");
const actionSummaryStatus = document.getElementById("action-summary-status");
const actionTotal = document.getElementById("action-total");
const actionDueSoon = document.getElementById("action-due-soon");
const actionLast = document.getElementById("action-last");
const actionStatuses = document.getElementById("action-statuses");
const actionPriorities = document.getElementById("action-priorities");
const driftForm = document.getElementById("drift-form");
const driftStatus = document.getElementById("drift-status");
const driftTotal = document.getElementById("drift-total");
const driftHigh = document.getElementById("drift-high");
const driftAction = document.getElementById("drift-action");
const driftLast = document.getElementById("drift-last");
const driftStages = document.getElementById("drift-stages");
const driftTypes = document.getElementById("drift-types");
const driftRecent = document.getElementById("drift-recent");
const driftRecentStatus = document.getElementById("drift-recent-status");
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

if (capacityForm) {
  capacityForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (capacityFormStatus) {
      capacityFormStatus.textContent = "Saving load check-in...";
    }

    const formData = new FormData(capacityForm);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch("/api/reviewer-load", {
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

      capacityForm.reset();
      if (capacityFormStatus) {
        capacityFormStatus.textContent = "Load check-in saved.";
      }
      loadCapacitySummary();
      loadCapacityRecent();
    } catch (error) {
      if (capacityFormStatus) {
        capacityFormStatus.textContent =
          error.message || "Could not save check-in.";
      }
    }
  });
}

if (actionForm) {
  actionForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (actionStatus) {
      actionStatus.textContent = "Saving action item...";
    }

    const formData = new FormData(actionForm);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch("/api/calibration-action", {
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

      actionForm.reset();
      if (actionStatus) {
        actionStatus.textContent = "Action saved. Team can track it below.";
      }
      loadActionSummary();
      loadActions();
    } catch (error) {
      if (actionStatus) {
        actionStatus.textContent = error.message || "Could not save action.";
      }
    }
  });
}

if (driftForm) {
  driftForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (driftStatus) {
      driftStatus.textContent = "Logging drift signal...";
    }

    const formData = new FormData(driftForm);
    const payload = Object.fromEntries(formData.entries());
    payload.action_needed = formData.get("action_needed") === "on";

    try {
      const response = await fetch("/api/drift-log", {
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

      driftForm.reset();
      if (driftStatus) {
        driftStatus.textContent = "Drift logged. Thanks for the signal.";
      }
      loadDriftSummary();
      loadDriftRecent();
    } catch (error) {
      if (driftStatus) {
        driftStatus.textContent = error.message || "Could not log drift.";
      }
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
  driftType: {
    criteria: "Criteria interpretation",
    evidence: "Evidence expectations",
    bias: "Bias disruption",
    scoring: "Score spread",
    consensus: "Consensus breakdown",
  },
  risk: {
    low: "Low risk",
    medium: "Medium risk",
    high: "High risk",
  },
};

const actionLabels = {
  status: {
    open: "Open",
    in_progress: "In progress",
    blocked: "Blocked",
    done: "Done",
  },
  priority: {
    high: "High priority",
    medium: "Medium priority",
    low: "Low priority",
  },
};

const riskLabels = {
  low: "Low risk",
  medium: "Medium risk",
  high: "High risk",
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

function formatDay(value) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function formatNumber(value, digits = 1) {
  if (value === null || value === undefined || value === "") return "—";
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return "—";
  return parsed % 1 === 0 ? parsed.toString() : parsed.toFixed(digits);
}

function toDateKey(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().split("T")[0];
}

function renderList(el, data, map = {}) {
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

function renderRecent(el, entries) {
  if (!el) return;
  el.innerHTML = "";
  if (!entries || !entries.length) {
    const item = document.createElement("li");
    item.textContent = "No recent feedback yet.";
    el.appendChild(item);
    return;
  }

  entries.forEach((entry) => {
    const item = document.createElement("li");
    const meta = document.createElement("div");
    meta.className = "recent-meta";
    const reviewer = document.createElement("span");
    reviewer.textContent = entry.reviewer || "Reviewer";
    const created = document.createElement("span");
    created.textContent = formatDate(entry.created_at);
    meta.append(reviewer, created);

    const note = document.createElement("p");
    note.textContent = entry.notes || "No notes provided.";

    const tags = document.createElement("div");
    tags.className = "recent-tags";

    if (entry.role) {
      const roleTag = document.createElement("span");
      roleTag.textContent = entry.role;
      tags.appendChild(roleTag);
    }

    const stageTag = document.createElement("span");
    stageTag.textContent = labelMaps.stage[entry.stage] || entry.stage;
    const focusTag = document.createElement("span");
    focusTag.textContent = labelMaps.focus[entry.focus] || entry.focus;
    tags.append(stageTag, focusTag);

    item.append(meta, note, tags);
    el.appendChild(item);
  });
}

function renderCapacityRecent(el, entries) {
  if (!el) return;
  el.innerHTML = "";
  if (!entries || !entries.length) {
    const item = document.createElement("li");
    item.textContent = "No load check-ins yet.";
    el.appendChild(item);
    return;
  }

  entries.forEach((entry) => {
    const item = document.createElement("li");
    const meta = document.createElement("div");
    meta.className = "capacity-meta";

    const reviewer = document.createElement("span");
    reviewer.textContent =
      entry.reviewer_label || entry.reviewer || "Reviewer";
    const created = document.createElement("span");
    created.textContent = formatDate(entry.created_at);
    meta.append(reviewer, created);

    const tags = document.createElement("div");
    tags.className = "capacity-tags";

    const assignmentsTag = document.createElement("span");
    assignmentsTag.textContent = `${entry.assignments ?? 0} assignments`;

    const hoursTag = document.createElement("span");
    hoursTag.textContent = `${formatNumber(entry.hours, 1)} hrs`;

    const riskTag = document.createElement("span");
    riskTag.textContent =
      labelMaps.risk[entry.risk_level] || entry.risk_level || "Risk";

    const stageTag = document.createElement("span");
    stageTag.textContent = labelMaps.stage[entry.stage] || entry.stage || "Stage";

    tags.append(assignmentsTag, hoursTag, riskTag, stageTag);

    item.append(meta);
    if (entry.notes) {
      const notes = document.createElement("p");
      notes.className = "muted";
      notes.textContent = entry.notes;
      item.appendChild(notes);
    }
    item.appendChild(tags);
    el.appendChild(item);
  });
}

function renderDriftRecent(el, entries) {
  if (!el) return;
  el.innerHTML = "";
  if (!entries || !entries.length) {
    const item = document.createElement("li");
    item.textContent = "No drift signals yet.";
    el.appendChild(item);
    return;
  }

  entries.forEach((entry) => {
    const item = document.createElement("li");

    const meta = document.createElement("div");
    meta.className = "drift-meta";
    const reviewer = document.createElement("span");
    reviewer.textContent = entry.reviewer || "Reviewer";
    const created = document.createElement("span");
    created.textContent = formatDate(entry.created_at);
    meta.append(reviewer, created);

    const note = document.createElement("p");
    note.textContent = entry.notes || "No notes provided.";

    const tags = document.createElement("div");
    tags.className = "drift-tags";

    if (entry.stage) {
      const stageTag = document.createElement("span");
      stageTag.textContent = labelMaps.stage[entry.stage] || entry.stage;
      tags.appendChild(stageTag);
    }

    if (entry.drift_type) {
      const typeTag = document.createElement("span");
      typeTag.textContent =
        labelMaps.driftType[entry.drift_type] || entry.drift_type;
      tags.appendChild(typeTag);
    }

    if (entry.severity) {
      const severityTag = document.createElement("span");
      severityTag.className = `severity-${entry.severity}`;
      severityTag.textContent = entry.severity;
      tags.appendChild(severityTag);
    }

    if (entry.action_needed) {
      const actionTag = document.createElement("span");
      actionTag.textContent = "Action needed";
      tags.appendChild(actionTag);
    }

    item.append(meta, note, tags);
    el.appendChild(item);
  });
}

function renderFollowups(el, entries) {
  if (!el) return;
  el.innerHTML = "";
  if (!entries || !entries.length) {
    const item = document.createElement("li");
    item.textContent = "No follow-up requests yet.";
    el.appendChild(item);
    return;
  }

  entries.forEach((entry) => {
    const item = document.createElement("li");

    const meta = document.createElement("div");
    meta.className = "followup-meta";
    const reviewer = document.createElement("span");
    reviewer.textContent = entry.name || "Reviewer";
    const created = document.createElement("span");
    created.textContent = formatDate(entry.created_at);
    meta.append(reviewer, created);

    const email = document.createElement("div");
    email.className = "followup-email";
    email.textContent = entry.email || "Email not provided.";

    const note = document.createElement("p");
    note.textContent = entry.notes || "No notes provided.";

    const tags = document.createElement("div");
    tags.className = "recent-tags";

    if (entry.role) {
      const roleTag = document.createElement("span");
      roleTag.textContent = entry.role;
      tags.appendChild(roleTag);
    }

    if (entry.stage) {
      const stageTag = document.createElement("span");
      stageTag.textContent = labelMaps.stage[entry.stage] || entry.stage;
      tags.appendChild(stageTag);
    }

    if (entry.focus) {
      const focusTag = document.createElement("span");
      focusTag.textContent = labelMaps.focus[entry.focus] || entry.focus;
      tags.appendChild(focusTag);
    }

    item.append(meta, email, note, tags);
    el.appendChild(item);
  });
}

function renderTrendChart(el, entries) {
  if (!el) return;
  el.innerHTML = "";
  if (!entries || !entries.length) {
    const item = document.createElement("li");
    item.textContent = "No recent submissions yet.";
    el.appendChild(item);
    return;
  }

  const maxValue = Math.max(...entries.map((entry) => entry.count || 0), 1);

  entries.forEach((entry) => {
    const item = document.createElement("li");
    const label = document.createElement("span");
    label.className = "trend-label";
    label.textContent = formatDay(entry.day);

    const bar = document.createElement("div");
    bar.className = "trend-bar";
    const fill = document.createElement("span");
    fill.style.width = `${Math.round((entry.count / maxValue) * 100)}%`;
    bar.appendChild(fill);

    const count = document.createElement("span");
    count.className = "trend-count";
    count.textContent = entry.count ?? 0;

    item.append(label, bar, count);
    el.appendChild(item);
  });
}

function renderHotspots(el, entries) {
  if (!el) return;
  el.innerHTML = "";
  if (!entries || !entries.length) {
    const item = document.createElement("li");
    item.textContent = "No hotspots yet.";
    el.appendChild(item);
    return;
  }

  entries.forEach((entry) => {
    const item = document.createElement("li");
    const label = document.createElement("div");
    label.className = "hotspot-label";
    const stage = labelMaps.stage[entry.stage] || entry.stage || "Unknown stage";
    const focus = labelMaps.focus[entry.focus] || entry.focus || "Unknown focus";
    label.textContent = `${stage} · ${focus}`;

    const count = document.createElement("strong");
    count.className = "hotspot-count";
    count.textContent = entry.count ?? "0";

    item.append(label, count);
    el.appendChild(item);
  });
}

function renderActions(el, entries) {
  if (!el) return;
  el.innerHTML = "";
  if (!entries || !entries.length) {
    const item = document.createElement("li");
    item.textContent = "No action items yet.";
    el.appendChild(item);
    return;
  }

  entries.forEach((entry) => {
    const item = document.createElement("li");
    const header = document.createElement("div");
    header.className = "action-header";

    const title = document.createElement("div");
    title.className = "action-title";
    title.textContent = entry.title || "Calibration action";

    const status = document.createElement("span");
    status.className = `action-status-chip status-${entry.status || "open"}`;
    status.textContent =
      actionLabels.status[entry.status] || entry.status || "Open";

    header.append(title, status);

    const meta = document.createElement("div");
    meta.className = "action-meta";
    const owner = document.createElement("span");
    owner.textContent = entry.owner ? `Owner: ${entry.owner}` : "Owner TBD";
    const due = document.createElement("span");
    due.textContent = entry.due_date
      ? `Due ${formatDate(entry.due_date)}`
      : "No due date";
    meta.append(owner, due);

    const detail = document.createElement("p");
    detail.textContent = entry.notes || "No notes attached yet.";

    const priority = document.createElement("span");
    priority.className = `action-priority priority-${entry.priority || "medium"}`;
    priority.textContent =
      actionLabels.priority[entry.priority] || entry.priority || "Medium";

    item.append(header, meta, detail, priority);
    el.appendChild(item);
  });
}

function renderCapacityRecent(el, entries) {
  if (!el) return;
  el.innerHTML = "";
  if (!entries || !entries.length) {
    const item = document.createElement("li");
    item.textContent = "No capacity check-ins yet.";
    el.appendChild(item);
    return;
  }

  entries.forEach((entry) => {
    const item = document.createElement("li");

    const meta = document.createElement("div");
    meta.className = "capacity-meta";
    const reviewer = document.createElement("span");
    reviewer.textContent = entry.reviewer || "Reviewer";
    const created = document.createElement("span");
    created.textContent = formatDate(entry.created_at);
    meta.append(reviewer, created);

    const detail = document.createElement("p");
    const assignments = Number(entry.assignments ?? 0);
    const hours = Number(entry.hours ?? 0);
    detail.textContent = `Assignments: ${assignments} · Hours: ${formatNumber(hours)}`;

    const notes = document.createElement("p");
    notes.textContent = entry.notes ? entry.notes : "No notes shared.";

    const tags = document.createElement("div");
    tags.className = "capacity-tags";

    if (entry.role) {
      const roleTag = document.createElement("span");
      roleTag.textContent = entry.role;
      tags.appendChild(roleTag);
    }

    if (entry.stage) {
      const stageTag = document.createElement("span");
      stageTag.textContent = labelMaps.stage[entry.stage] || entry.stage;
      tags.appendChild(stageTag);
    }

    if (entry.risk_level) {
      const riskTag = document.createElement("span");
      riskTag.textContent = riskLabels[entry.risk_level] || entry.risk_level;
      tags.appendChild(riskTag);
    }

    if (entry.confidence) {
      const confidenceTag = document.createElement("span");
      confidenceTag.textContent = `Confidence ${entry.confidence}`;
      tags.appendChild(confidenceTag);
    }

    item.append(meta, detail, notes, tags);
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
    renderList(pulseRoles, result.roles, {});
    pulseStatus.textContent = "Updated from rubric feedback database.";
  } catch (error) {
    if (pulseStatus) {
      pulseStatus.textContent = error.message || "Could not load pulse data.";
    }
  }
}

async function loadCapacitySummary() {
  if (!capacityStatus) return;
  capacityStatus.textContent = "Loading capacity ledger...";
  try {
    const response = await fetch("/api/reviewer-load-summary");
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result.error || "Unable to load capacity data.");
    }

    if (capacityAverage) {
      capacityAverage.textContent = formatNumber(result.avg_assignments, 1);
    }
    if (capacityHours) {
      capacityHours.textContent = formatNumber(result.total_hours, 1);
    }
    if (capacityRisk) {
      capacityRisk.textContent = result.high_risk ?? "0";
    }

    renderList(capacityRiskList, result.risk_mix, labelMaps.risk);
    capacityStatus.textContent = "Capacity ledger synced.";
  } catch (error) {
    capacityStatus.textContent =
      error.message || "Could not load capacity ledger.";
  }
}

async function loadCapacityRecent() {
  if (!capacityRecentStatus) return;
  capacityRecentStatus.textContent = "Loading latest check-ins...";
  try {
    const response = await fetch("/api/reviewer-load-recent");
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result.error || "Unable to load recent check-ins.");
    }
    renderCapacityRecent(capacityRecent, result.entries || []);
    capacityRecentStatus.textContent = "Latest check-ins loaded.";
  } catch (error) {
    capacityRecentStatus.textContent =
      error.message || "Could not load recent check-ins.";
  }
}

async function loadActionSummary() {
  if (!actionSummaryStatus) return;
  actionSummaryStatus.textContent = "Loading action summary...";
  try {
    const response = await fetch("/api/calibration-action-summary");
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result.error || "Unable to load action summary.");
    }

    if (actionTotal) actionTotal.textContent = result.total ?? "0";
    if (actionDueSoon) actionDueSoon.textContent = result.due_soon ?? "0";
    if (actionLast) actionLast.textContent = formatDate(result.last_action);

    renderList(actionStatuses, result.statuses, actionLabels.status);
    renderList(actionPriorities, result.priorities, actionLabels.priority);
    actionSummaryStatus.textContent = "Action board synced.";
  } catch (error) {
    actionSummaryStatus.textContent =
      error.message || "Could not load action summary.";
  }
}

async function loadActions() {
  if (!actionSummaryStatus) return;
  try {
    const response = await fetch("/api/calibration-actions");
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result.error || "Unable to load actions.");
    }
    renderActions(actionList, result.entries || []);
  } catch (error) {
    if (actionList) {
      actionList.innerHTML = "";
      const item = document.createElement("li");
      item.textContent = error.message || "Could not load actions.";
      actionList.appendChild(item);
    }
  }
}

async function loadDriftSummary() {
  if (!driftRecentStatus) return;
  driftRecentStatus.textContent = "Loading drift summary...";
  try {
    const response = await fetch("/api/drift-summary");
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result.error || "Unable to load drift summary.");
    }

    if (driftTotal) driftTotal.textContent = result.total ?? "0";
    if (driftHigh) driftHigh.textContent = result.high_severity ?? "0";
    if (driftAction) driftAction.textContent = result.action_needed ?? "0";
    if (driftLast) driftLast.textContent = formatDate(result.last_entry);

    renderList(driftStages, result.stages, labelMaps.stage);
    renderList(driftTypes, result.types, labelMaps.driftType);
    driftRecentStatus.textContent = "Drift summary updated.";
  } catch (error) {
    driftRecentStatus.textContent =
      error.message || "Could not load drift summary.";
  }
}

async function loadDriftRecent() {
  if (!driftRecentStatus) return;
  driftRecentStatus.textContent = "Loading recent drift signals...";
  try {
    const response = await fetch("/api/drift-recent");
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result.error || "Unable to load recent drift.");
    }
    renderDriftRecent(driftRecent, result.entries || []);
    driftRecentStatus.textContent = "Recent drift synced.";
  } catch (error) {
    driftRecentStatus.textContent =
      error.message || "Could not load recent drift.";
  }
}


async function loadTrendPulse() {
  if (!pulseTrendStatus) return;
  pulseTrendStatus.textContent = "Loading trendline...";
  try {
    const response = await fetch("/api/feedback-trends");
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result.error || "Unable to load trend data.");
    }

    const series = Array.isArray(result.series) ? result.series : [];
    const dayMap = new Map();
    series.forEach((entry) => {
      const key = toDateKey(entry.day);
      if (key) dayMap.set(key, Number(entry.count) || 0);
    });

    const today = new Date();
    const trendEntries = [];
    for (let i = 13; i >= 0; i -= 1) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const key = toDateKey(date);
      trendEntries.push({
        day: date,
        count: dayMap.get(key) || 0,
      });
    }

    const totalRecent = trendEntries.reduce((acc, entry) => acc + entry.count, 0);
    if (pulseTrendTotal) pulseTrendTotal.textContent = totalRecent;

    const peakEntry =
      trendEntries.reduce(
        (best, entry) => (entry.count > best.count ? entry : best),
        { count: -1, day: null }
      ) || {};
    if (pulseTrendPeak) {
      pulseTrendPeak.textContent =
        peakEntry.day && peakEntry.count >= 0
          ? `${formatDay(peakEntry.day)} (${peakEntry.count})`
          : "—";
    }

    renderTrendChart(pulseTrendChart, trendEntries);
    renderList(pulseTrendFocus, result.focus || {}, labelMaps.focus);
    renderList(pulseTrendStage, result.stages || {}, labelMaps.stage);
    pulseTrendStatus.textContent = "Trendline updated.";
  } catch (error) {
    pulseTrendStatus.textContent =
      error.message || "Could not load trendline.";
  }
}

async function loadRecentFeedback() {
  if (!pulseRecentStatus) return;
  pulseRecentStatus.textContent = "Syncing latest notes...";
  try {
    const response = await fetch("/api/feedback-recent");
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result.error || "Unable to load recent notes.");
    }
    renderRecent(pulseRecent, result.entries || result.items || []);
    pulseRecentStatus.textContent = "Latest notes loaded.";
  } catch (error) {
    pulseRecentStatus.textContent =
      error.message || "Could not load recent notes.";
  }
}

async function loadFollowups() {
  if (!pulseFollowupStatus) return;
  pulseFollowupStatus.textContent = "Loading follow-up requests...";
  try {
    const response = await fetch("/api/feedback-followup");
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result.error || "Unable to load follow-up list.");
    }

    renderFollowups(pulseFollowupList, result.entries || []);
    pulseFollowupStatus.textContent = "Follow-up queue ready.";
  } catch (error) {
    if (pulseFollowupStatus) {
      pulseFollowupStatus.textContent =
        error.message || "Could not load follow-up list.";
    }
  }
}

async function loadHotspots() {
  if (!pulseHotspotsStatus) return;
  pulseHotspotsStatus.textContent = "Scanning hotspots...";
  try {
    const response = await fetch("/api/feedback-hotspots");
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result.error || "Unable to load hotspots.");
    }
    renderHotspots(pulseHotspots, result.entries || []);
    pulseHotspotsStatus.textContent = "Hotspot signals updated.";
  } catch (error) {
    if (pulseHotspotsStatus) {
      pulseHotspotsStatus.textContent =
        error.message || "Could not load hotspots.";
    }
  }
}

loadPulseSummary();
loadTrendPulse();
loadRecentFeedback();
loadFollowups();
loadHotspots();
loadCapacitySummary();
loadCapacityRecent();
loadActionSummary();
loadActions();
loadDriftSummary();
loadDriftRecent();
