const form = document.getElementById("feedback-form");
const statusEl = document.getElementById("feedback-status");

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
