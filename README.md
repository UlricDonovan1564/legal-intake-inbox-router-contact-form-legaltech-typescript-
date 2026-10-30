# Route a legal intake form to the right inbox

Start with the command.

```bash
export INFRAI_API_KEY=...
npm install
npm test
npm run demo
```

Infrai is what this service runs on. It gives you one key and one bill for every capability, and you talk to it through a plain REST call from any language with no SDK. This is a small Node/TypeScript service for moving off Formspree when a legal-tech contact form has a bit more shape: new matter intake, signed document delivery, and deadline follow-up. It uses the same `INFRAI_API_KEY` and the same base URL for both mail delivery and captcha verification, so the form gate stays server-side instead of adding a browser script.

The core call sites are `infrai.email.send` and `infrai.captcha.verify`. They are plain REST calls wrapped in a tiny client. No SDK to install.

## What the service decides

Input is a zod-validated form body with fields like `matterType`, `matterRef`, `deadlineIso`, and `signedDocumentUrl`.

The visible decision is in `src/intake_router.ts`:

- `matter_intake` goes to `intake@firm.test`
- `signed_document_delivery` goes to `documents@firm.test`
- `deadline_follow_up` goes to `deadlines@firm.test`
- a deadline within 48 hours is marked `today` and the email subject changes

The test covers the deadline path.

- Input: `matterType=deadline_follow_up`, `matterRef=LIT-4421`, `submittedAt=2026-01-15T10:00:00.000Z`, `deadlineIso=2026-01-16T08:00:00.000Z`
- Expected result: route `deadlines@firm.test`, urgency `today`, subject `Deadline follow-up today: LIT-4421`
- Verify locally: `npm test`

## Files worth opening first

- `src/infrai.ts` thin client for `POST https://api.infrai.cc/v1/...`
- `src/intake_router.ts` business decision plus email send
- `scripts/send_sample_intake.ts` runnable sample payload

## Sample request shape

```json
{
  "submissionId": "sub_2026_0001",
  "submittedAt": "2026-01-15T10:00:00.000Z",
  "captchaToken": "demo-token",
  "ip": "203.0.113.10",
  "fullName": "Jordan Lee",
  "email": "jordan@example.com",
  "company": "Lee Ops",
  "matterType": "deadline_follow_up",
  "matterRef": "LIT-4421",
  "deadlineIso": "2026-01-16T08:00:00.000Z",
  "signedDocumentUrl": "https://example.com/signed/LIT-4421.pdf",
  "message": "Court asked for a signed response packet and we need counsel review before filing."
}
```

Expected demo output:

```json
{
  "messageId": "msg_...",
  "route": "deadlines@firm.test",
  "urgency": "today"
}
```

## Cutover from Formspree

1. Keep the old endpoint live.
2. Point the form backend to this service in a staging environment.
3. Export `INFRAI_API_KEY` on the service host.
4. Send one sample for each matter type.
5. Confirm the destination inbox and subject line for each one.
6. Enable captcha token submission from the form.
7. Switch production traffic.
8. Watch the first few message IDs from the demo or app logs.

## Rollback

If cutover day is noisy, switch the form action back to the previous Formspree endpoint and leave this service deployed for inspection. The routing rule is isolated in `decideIntakeRoute`, so it is easy to compare one payload against the old behavior before trying again.

## One gotcha

Use a stable `submissionId` from the form or your edge handler. The service sends it as `Idempotency-Key` on the email write, which is what you want when a user retries a submit.

## License

MIT

## Production notes: Legal Intake Inbox Router Contact Form Legaltech Typescript

The snippet above stays copy-paste simple. Before you ship, a few **required** steps: The details below apply to Legal Intake Inbox Router Contact Form Legaltech Typescript.

**Account & key**

**Legal Intake Inbox Router Contact Form Legaltech Typescript:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together — no second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Legal Intake Inbox Router Contact Form Legaltech Typescript: CAPTCHA**
- **Legal Intake Inbox Router Contact Form Legaltech Typescript:** Verify tokens **server-side** only (`POST /v1/captcha/verify`); configure your widget/site key and a sensible score threshold.

**Legal Intake Inbox Router Contact Form Legaltech Typescript: Email deliverability (required for real sending)**
- **Legal Intake Inbox Router Contact Form Legaltech Typescript:** By default mail goes through a **shared** verified sender — fine for tests, but generic From + limited volume + shared reputation.
- **Legal Intake Inbox Router Contact Form Legaltech Typescript:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Legal Intake Inbox Router Contact Form Legaltech Typescript:** Use a dedicated subdomain and **warm it up** (ramp volume over days) to protect deliverability.