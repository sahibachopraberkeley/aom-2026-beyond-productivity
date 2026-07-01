# Beyond Productivity — AOM 2026 PDW

Event site + interest form for the Professional Development Workshop
**"Beyond Productivity: Designing Research on AI Adoption, Evaluation, and
Training"** (AOM 2026, Submission 13506).

📅 **Fri, July 31, 2026 · 8:00–10:00 AM ET** · Loews Hotel, Congress C
🎯 Sponsored by TIM · OB · OMT

## What's here
- **`index.html` / `styles.css` / `script.js`** — the single-page site (served
  by GitHub Pages). Includes the registration form with a 1–5 roundtable
  ranking grid.
- **`backend/`** — an AWS serverless stack (API Gateway → Lambda → DynamoDB)
  that stores submissions, plus `export.mjs` to pull responses into CSV and
  auto-suggest balanced roundtable groups. See [`backend/DEPLOY.md`](backend/DEPLOY.md).
- **`plan.md`** — the full build plan and content source-of-truth.

## Run locally
```bash
python3 -m http.server 8000   # then open http://localhost:8000
```
The form runs in **demo mode** until you set `API_ENDPOINT` in `script.js`.

## Go live
1. **Site:** push to GitHub → Settings → Pages → deploy from `main` / root.
   Site lives at `https://<user>.github.io/aom-2026-beyond-productivity/`.
2. **Backend:** follow [`backend/DEPLOY.md`](backend/DEPLOY.md) (≈10 min), then
   paste the API URL into `script.js`.

## The five roundtables
| # | Leader | Focus |
|---|--------|-------|
| R1 | Mathijs de Vaan (UC Berkeley) | Measuring adoption from behavioral trace data |
| R2 | Natalie Carlson (Wharton) | Generating & evaluating candidate mechanisms |
| R3 | Charles Ayoubi (ESSEC) | How AI-mediated information reshapes evaluation |
| R4 | Sahiba Chopra (UC Berkeley) | Work & evaluation in collaborative settings |
| R5 | Michael Impink (HEC Paris) | Technology–skill complementarity, historically |

## To customize
- Edit roundtable text in `index.html` **and** the `ROUNDTABLES` array in
  `script.js` (keep the two in sync).
- Set the "register by" date and any leader links in `index.html`.
