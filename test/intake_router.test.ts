import test from "node:test";
import assert from "node:assert/strict";
import { decideIntakeRoute } from "../src/intake_router";

test("deadline follow-up due within 48 hours routes to deadlines inbox with today urgency", () => {
  const decision = decideIntakeRoute({
    submissionId: "sub_2026_fast",
    submittedAt: "2026-01-15T10:00:00.000Z",
    captchaWidgetRecordId: "widget-record",
    captchaToken: "token",
    ip: "203.0.113.10",
    fullName: "Jordan Lee",
    email: "jordan@example.com",
    matterType: "deadline_follow_up",
    matterRef: "LIT-4421",
    deadlineIso: "2026-01-16T08:00:00.000Z",
    message: "Need a filing check before tomorrow morning.",
    signedDocumentUrl: "https://example.com/signed/LIT-4421.pdf"
  });

  assert.deepEqual(decision, {
    route: "deadlines@firm.test",
    urgency: "today",
    subject: "Deadline follow-up today: LIT-4421"
  });
});
