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

// ── Build the drag-and-drop ranking list ──────────────────────────────────
const rankListEl = document.getElementById("rankList");
const rankError = document.getElementById("rankError");

ROUNDTABLES.forEach((rt) => {
  const li = document.createElement("li");
  li.className = "ranklist__item";
  li.draggable = true;
  li.dataset.id = rt.id;
  li.innerHTML = `
    <span class="ranklist__num" aria-hidden="true"></span>
    <span class="ranklist__grip" aria-hidden="true">⠿</span>
    <span class="ranklist__label"><b>${rt.leader}</b><small>${rt.short}</small></span>
    <span class="ranklist__moves">
      <button type="button" class="ranklist__move" data-dir="up" aria-label="Move ${rt.leader} up">↑</button>
      <button type="button" class="ranklist__move" data-dir="down" aria-label="Move ${rt.leader} down">↓</button>
    </span>`;
  rankListEl.appendChild(li);
});

function renumber() {
  [...rankListEl.children].forEach((li, i) => {
    li.querySelector(".ranklist__num").textContent = i + 1;
  });
}
renumber();

// Drag to reorder (desktop / mouse)
let dragEl = null;
rankListEl.addEventListener("dragstart", (e) => {
  dragEl = e.target.closest(".ranklist__item");
  if (!dragEl) return;
  dragEl.classList.add("is-dragging");
  e.dataTransfer.effectAllowed = "move";
});
rankListEl.addEventListener("dragend", () => {
  if (dragEl) dragEl.classList.remove("is-dragging");
  dragEl = null;
  renumber();
});
rankListEl.addEventListener("dragover", (e) => {
  e.preventDefault();
  if (!dragEl) return;
  const after = dragAfter(e.clientY);
  if (after == null) rankListEl.appendChild(dragEl);
  else rankListEl.insertBefore(dragEl, after);
});
function dragAfter(y) {
  const items = [...rankListEl.querySelectorAll(".ranklist__item:not(.is-dragging)")];
  return items.reduce(
    (closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      return offset < 0 && offset > closest.offset ? { offset, element: child } : closest;
    },
    { offset: -Infinity, element: null }
  ).element;
}

// Up / down buttons (touch + keyboard accessible)
rankListEl.addEventListener("click", (e) => {
  const btn = e.target.closest(".ranklist__move");
  if (!btn) return;
  const li = btn.closest(".ranklist__item");
  if (btn.dataset.dir === "up" && li.previousElementSibling) {
    rankListEl.insertBefore(li, li.previousElementSibling);
  } else if (btn.dataset.dir === "down" && li.nextElementSibling) {
    rankListEl.insertBefore(li.nextElementSibling, li);
  }
  renumber();
  rankError.hidden = true;
  btn.focus();
});

// Order of the list is the ranking: position 1 = most preferred.
function collectRanks() {
  const items = [...rankListEl.children];
  if (items.length !== ROUNDTABLES.length) return null;
  const ranks = {};
  items.forEach((li, i) => { ranks[li.dataset.id] = i + 1; });
  return ranks;
}

// Restore the list to its initial order (used after a successful submit).
function resetRankList() {
  ROUNDTABLES.forEach((rt) => {
    const li = rankListEl.querySelector(`.ranklist__item[data-id="${rt.id}"]`);
    if (li) rankListEl.appendChild(li);
  });
  renumber();
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
    resetRankList();
  } catch (err) {
    if (err instanceof DemoNotWired) {
      statusEl.classList.add("is-success");
      statusEl.textContent = "✓ Looks good! (Demo mode: connect the AWS endpoint in script.js to go live.)";
      form.reset();
      resetRankList();
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
