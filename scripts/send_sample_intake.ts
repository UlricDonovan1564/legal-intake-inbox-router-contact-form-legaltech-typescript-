import { routeLegalIntake } from "../src/intake_router";

const sample = {
  submissionId: "sub_2026_0001",
  submittedAt: "2026-01-15T10:00:00.000Z",
  captchaWidgetRecordId: process.env.DEMO_CAPTCHA_WIDGET_RECORD_ID || "demo-widget-record",
  captchaToken: process.env.DEMO_CAPTCHA_TOKEN || "demo-token",
  ip: "203.0.113.10",
  fullName: "Jordan Lee",
  email: "jordan@example.com",
  company: "Lee Ops",
  matterType: "deadline_follow_up",
  matterRef: "LIT-4421",
  deadlineIso: "2026-01-16T08:00:00.000Z",
  message: "Court asked for a signed response packet and we need counsel review before filing.",
  signedDocumentUrl: "https://example.com/signed/LIT-4421.pdf"
};

const result = await routeLegalIntake(sample);
console.log(JSON.stringify(result, null, 2));
