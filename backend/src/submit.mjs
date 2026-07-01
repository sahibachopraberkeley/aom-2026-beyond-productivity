// Lambda handler: POST /register -> validate -> write to DynamoDB.
// Node 18 runtime ships the AWS SDK v3, so no dependencies to bundle.
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.TABLE_NAME;
const ORIGIN = process.env.ALLOW_ORIGIN || "*";

const REQUIRED = ["firstName", "lastName", "email", "position", "institution", "researchInterests"];
const ROUNDTABLE_IDS = ["R1", "R2", "R3", "R4", "R5"];

const cors = {
  "Access-Control-Allow-Origin": ORIGIN,
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Content-Type": "application/json",
};

const reply = (statusCode, body) => ({ statusCode, headers: cors, body: JSON.stringify(body) });

export const handler = async (event) => {
  try {
    if (!event.body) return reply(400, { error: "Empty request body." });

    let data;
    try {
      data = JSON.parse(event.body);
    } catch {
      return reply(400, { error: "Invalid JSON." });
    }

    // Required fields present & non-empty
    for (const f of REQUIRED) {
      if (typeof data[f] !== "string" || !data[f].trim()) {
        return reply(400, { error: `Missing or empty field: ${f}` });
      }
    }
    // Basic email sanity
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.email)) {
      return reply(400, { error: "Invalid email address." });
    }
    // Rankings: all five roundtables, unique values 1..5
    const r = data.rankings || {};
    const vals = ROUNDTABLE_IDS.map((id) => r[id]);
    const ok =
      vals.every((v) => Number.isInteger(v) && v >= 1 && v <= 5) &&
      new Set(vals).size === 5;
    if (!ok) return reply(400, { error: "Rankings must assign each roundtable a unique rank 1–5." });

    const item = {
      email: data.email.trim().toLowerCase(),
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      position: String(data.position).slice(0, 120),
      institution: data.institution.trim().slice(0, 300),
      researchInterests: data.researchInterests.trim().slice(0, 2000),
      rankings: ROUNDTABLE_IDS.reduce((acc, id) => ((acc[id] = r[id]), acc), {}),
      submittedAt: new Date().toISOString(),
    };

    // PK = email, so a re-submission updates the same person (natural dedupe).
    await ddb.send(new PutCommand({ TableName: TABLE, Item: item }));

    return reply(200, { ok: true });
  } catch (err) {
    console.error(err);
    return reply(500, { error: "Server error. Please try again." });
  }
};
