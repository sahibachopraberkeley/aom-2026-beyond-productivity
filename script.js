/* =========================================================================
   Beyond AI Productivity · AOM 2026 PDW
   ========================================================================= */

// ── CONFIG ────────────────────────────────────────────────────────────────
// After deploying the AWS backend (see backend/DEPLOY.md), paste the API URL
// here. Leave as-is to run the site in "demo" mode (logs instead of posting).
const API_ENDPOINT = "https://x4h3z2cxc2.execute-api.us-east-1.amazonaws.com/register";

// Roundtables: order here is the order shown in the ranking grid.
const ROUNDTABLES = [
  { id: "R1", leader: "Natalie Carlson", short: "Generating & evaluating candidate mechanisms" },
  { id: "R2", leader: "Charles Ayoubi", short: "How AI-mediated information reshapes evaluation" },
  { id: "R3", leader: "Michael Impink", short: "The co-evolution of technology, skill, and training" },
  { id: "R4", leader: "Mathijs de Vaan", short: "Measuring adoption from behavioral trace data" },
  { id: "R5", leader: "Sahiba Chopra", short: "Work & evaluation in collaborative settings" },
];

// ── Build the ranking grid ────────────────────────────────────────────────
const rankGridEl = document.querySelector("#rankGrid .rank__grid");
ROUNDTABLES.forEach((rt) => {
  const row = document.createElement("div");
  row.className = "rank__row";
  const topic = document.createElement("span");
  topic.className = "rank__topic";
  topic.innerHTML = `<b>${rt.id}</b> · ${rt.leader} <small>${rt.short}</small>`;
  row.appendChild(topic);
  for (let rank = 1; rank <= 5; rank++) {
    const cell = document.createElement("span");
    cell.className = "rank__cell";
    const input = document.createElement("input");
    input.type = "radio";
    input.name = `rank_${rt.id}`;
    input.value = String(rank);
    input.setAttribute("aria-label", `${rt.id}, rank ${rank}`);
    cell.appendChild(input);
    row.appendChild(cell);
  }
  rankGridEl.appendChild(row);
});

// Enforce unique ranks: selecting a rank clears that rank from other rows.
const rankError = document.getElementById("rankError");
rankGridEl.addEventListener("change", (e) => {
  if (e.target.type !== "radio") return;
  const chosen = e.target.value;
  const ownRow = e.target.closest(".rank__row");
  rankGridEl.querySelectorAll(".rank__row").forEach((row) => {
    if (row === ownRow) return;
    const clash = row.querySelector(`input[value="${chosen}"]`);
    if (clash && clash.checked) clash.checked = false;
  });
  rankError.hidden = true;
});

function collectRanks() {
  const ranks = {};
  for (const rt of ROUNDTABLES) {
    const picked = rankGridEl.querySelector(`input[name="rank_${rt.id}"]:checked`);
    if (!picked) return null; // incomplete
    ranks[rt.id] = Number(picked.value);
  }
  // all five must be present and unique (uniqueness enforced above, but verify)
  const values = Object.values(ranks);
  if (new Set(values).size !== 5) return null;
  return ranks;
}

// ── Form submission ───────────────────────────────────────────────────────
const form = document.getElementById("registerForm");
const statusEl = document.getElementById("formStatus");
const submitBtn = document.getElementById("submitBtn");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  statusEl.className = "form__status";
  statusEl.textContent = "";

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }
  const ranks = collectRanks();
  if (!ranks) {
    rankError.hidden = false;
    rankError.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  const fd = new FormData(form);
  const payload = {
    firstName: fd.get("firstName").trim(),
    lastName: fd.get("lastName").trim(),
    email: fd.get("email").trim().toLowerCase(),
    position: fd.get("position"),
    institution: fd.get("institution").trim(),
    researchInterests: fd.get("researchInterests").trim(),
    rankings: ranks,
  };

  submitBtn.disabled = true;
  submitBtn.textContent = "Submitting…";

  try {
    if (!API_ENDPOINT) {
      // Demo mode: backend not wired up yet.
      console.info("[demo] would POST:", payload);
      await new Promise((r) => setTimeout(r, 500));
      throw new DemoNotWired();
    }
    const res = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Server responded ${res.status}`);

    statusEl.classList.add("is-success");
    statusEl.textContent = "✓ You're registered, thank you! We'll be in touch about the roundtables.";
    form.reset();
    rankGridEl.querySelectorAll("input:checked").forEach((i) => (i.checked = false));
  } catch (err) {
    if (err instanceof DemoNotWired) {
      statusEl.classList.add("is-success");
      statusEl.textContent = "✓ Looks good! (Demo mode: connect the AWS endpoint in script.js to go live.)";
      form.reset();
      rankGridEl.querySelectorAll("input:checked").forEach((i) => (i.checked = false));
    } else {
      statusEl.classList.add("is-error");
      statusEl.textContent = "Something went wrong submitting. Please try again, or email sahiba.chopra@berkeley.edu.";
      console.error(err);
    }
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit registration";
  }
});

class DemoNotWired extends Error {}

// ── Scroll reveal ─────────────────────────────────────────────────────────
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);
document.querySelectorAll(".reveal").forEach((el, i) => {
  el.style.transitionDelay = `${Math.min(i % 4, 3) * 60}ms`;
  io.observe(el);
});

// ── Nav shade on scroll ───────────────────────────────────────────────────
const nav = document.getElementById("nav");
addEventListener("scroll", () => {
  nav.style.background =
    scrollY > 40 ? "rgba(11,13,23,.92)" : "rgba(11,13,23,.72)";
});
