# Backend deploy — AWS (API Gateway → Lambda → DynamoDB)

The site works in **demo mode** with no backend. To collect real responses,
deploy this stack once, then paste one URL into `script.js`.

## What you get
- A DynamoDB table `BeyondProductivityRegistrations` (partition key = `email`,
  so re-submissions update the same person).
- A Lambda that validates and stores each submission.
- A public HTTP API endpoint (`POST /register`), CORS-locked to your site.
- **No public read path** — you pull data locally with your own AWS credentials.

## One-time setup
1. **Install tools**
   - [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) → `aws configure` (set an IAM user's keys + region, e.g. `us-east-1`).
   - [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html).

2. **Deploy**
   ```bash
   cd backend
   sam build
   sam deploy --guided
   ```
   In the guided prompts:
   - Stack name: `beyond-productivity-pdw`
   - Region: e.g. `us-east-1`
   - Parameter **AllowOrigin**: your GitHub Pages origin, **no trailing slash**,
     e.g. `https://sahibachopraberkeley.github.io`
     *(use `*` only while testing locally).*
   - Allow SAM to create roles: `Y`
   - Save arguments to `samconfig.toml`: `Y` (so future deploys are just `sam deploy`).

3. **Wire the site to the API**
   Copy the `ApiEndpoint` output (ends in `/register`) into `script.js`:
   ```js
   const API_ENDPOINT = "https://xxxx.execute-api.us-east-1.amazonaws.com/register";
   ```
   Commit + push. The live form now posts to AWS.

## Pull responses & get suggested groups
Any time (from the `backend/` folder):
```bash
node export.mjs
# or, if you changed region/table:
REGION=us-east-1 TABLE=BeyondProductivityRegistrations node export.mjs
# force a max table size:
node export.mjs --cap 8
```
Outputs:
- `registrations.csv` — every response (open in Excel/Sheets).
- `suggested-groups.csv` — a balanced first-pass assignment honoring each
  person's ranked preferences, plus a satisfaction summary in the terminal.

The grouping is a starting point you can hand-tune — the `rank_R1…rank_R5`
columns in `registrations.csv` let you rebalance by hand.

## Costs & teardown
- Well within AWS Free Tier for a PDW-sized list (pay-per-request DynamoDB +
  a tiny Lambda). Effectively $0.
- Remove everything when done:
  ```bash
  sam delete --stack-name beyond-productivity-pdw
  ```

## CORS gotcha
If the browser console shows a CORS error after going live, the `AllowOrigin`
parameter doesn't exactly match your site's origin. Redeploy with the exact
origin: `sam deploy --parameter-overrides AllowOrigin=https://<user>.github.io`
