# Website Plan — *Beyond Productivity* (AOM 2026 PDW)

> A single-page event site + interest form for the PDW **"Beyond Productivity:
> Designing Research on AI Adoption, Evaluation, and Training"** (AOM 2026,
> Submission 13506). Goal: make scholars *want* to walk in the door, and make it
> trivial for the organizer to sort registrants into the five roundtables.

---

## 1. Session facts (single source of truth)

| Field | Value |
|---|---|
| **Title** | Beyond Productivity: Designing Research on AI Adoption, Evaluation, and Training |
| **Type** | Professional Development Workshop (PDW) |
| **Submission #** | 13506 |
| **When** | Friday, July 31, 2026 · 8:00–10:00 AM ET (GMT-4) |
| **Where** | Loews Hotel · Congress C |
| **Primary sponsor** | Technology and Innovation Management (TIM) |
| **Co-sponsors** | Organizational Behavior (OB) · Organization and Management Theory (OMT) |
| **Format** | 3 parts: teaser talks (50m) → 5 parallel roundtables (45m) → plenary synthesis (20m) |
| **Register by** | (recommended) mid-July 2026 — set final date on site |

## 2. The five roundtables (grouping targets)

Grouped under three themes. These are the options participants rank 1–5.

**Theme 1 — Measurement & early-stage theory building**
- **R1 · Mathijs de Vaan (UC Berkeley)** — Designing measures from behavioral
  trace data: adoption intensity, trajectories, and socially embedded diffusion.
- **R2 · Natalie Carlson (Wharton)** — Systematically generating and evaluating
  candidate mechanisms under overdetermination (computation + human judgment).

**Theme 2 — Evaluation under AI**
- **R3 · Charles Ayoubi (ESSEC)** — How AI-mediated information reshapes
  evaluation; isolating efficiency gains from judgment distortions.
- **R4 · Sahiba Chopra (UC Berkeley)** *(organizer)* — How AI transforms the
  work–evaluation relationship in collaboration; identifying AI use in
  observational data.

**Theme 3 — Skill formation & adaptation**
- **R5 · Michael Impink (HEC Paris)** — Historical analysis of technology–skill
  complementarity; co-evolution of tools, tasks, and training institutions.

## 3. Page structure (single-page scroll)

1. **Hero** — animated gradient, title, date/location chip, dual CTA
   ("Register your interest" + "See the roundtables"). Countdown-free, elegant.
2. **The problem** — 4 research-design challenges as a punchy lead-in ("beyond
   binary adoption indicators…"). Establishes why this room is worth 2 hours.
3. **Three themes** — cards linking themes → roundtables.
4. **Roundtable leaders** — 5 cards: name, affiliation, the "research seed"
   question. This is the hook — people come for the people + puzzles.
5. **Agenda** — visual timeline of the 120 minutes.
6. **Register** — native form (see §4), styled to match the site.
7. **Footer** — organizer, sponsors (TIM/OB/OMT), AOM 2026 note.

**Aesthetic:** modern academic. Dark hero, light body, one bold accent
(electric indigo) + warm secondary. `Space Grotesk` display + `Inter` body.
Scroll-reveal animations, sticky nav, fully responsive, accessible (labels,
focus states, reduced-motion support).

## 4. Interest form

Fields (mirrors the reference form; `*` required):
- First name*, Last name*, Email*
- Position* — Predoctoral Candidate / PhD Student/Candidate / Postdoctoral
  researcher / Junior Faculty / Senior Faculty / Other
- University/Institution*
- Research interests* (3–5 keywords or 1–2 lines)
- **Rank roundtables 1–5*** — grid (rows = R1–R5, columns = 1–5), JS-enforced
  unique ranks, all required.

**Backend (AWS serverless, no Google Forms):**
```
Browser form ──POST──▶ API Gateway (HTTP API) ──▶ Lambda ──▶ DynamoDB table
                                                              (PK = email)
Organizer ──local script (AWS creds)──▶ DynamoDB scan ──▶ registrations.csv
                                                       └▶ suggested-groups.csv
```
- Submit is public (CORS locked to the Pages origin). **No public read
  endpoint** — data is pulled locally with the organizer's AWS credentials, so
  registrant PII is never exposed on the open web.
- `export.mjs` scans the table, writes a clean CSV **and** a preliminary group
  assignment that (a) honors first choices, then (b) balances table sizes using
  each person's ranked fallbacks.

## 5. Repo layout
```
aom-2026-beyond-productivity/
├── index.html          # the site (Pages serves from root)
├── styles.css
├── script.js           # scroll reveals, ranking-grid logic, form submit
├── assets/             # favicon / og image
├── backend/
│   ├── template.yaml    # AWS SAM: HTTP API + Lambda + DynamoDB
│   ├── src/submit.mjs   # Lambda handler (POST /register)
│   ├── export.mjs       # local: DynamoDB → CSV + suggested groups
│   └── DEPLOY.md        # step-by-step AWS deploy + config
├── plan.md             # this file
└── README.md
```

## 6. Deploy
- **Site:** GitHub Pages from `main` / root → `https://<user>.github.io/aom-2026-beyond-productivity/`.
- **Backend:** `sam build && sam deploy --guided` (one time). Paste the returned
  API URL into `script.js` (`API_ENDPOINT`) and the Pages origin into the SAM
  CORS param. Redeploy site.

## 7. Open items for the organizer
- [ ] Confirm final "register by" date.
- [ ] Confirm leader affiliations/spellings and whether to add photos/links.
- [ ] Deploy SAM stack, wire `API_ENDPOINT`, enable Pages.
- [ ] (Optional) custom domain.
