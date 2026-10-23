import { InfraiError, infrai } from "./infrai";
import { intakeSchema, type IntakeForm } from "./intake_schema";

export type InboxRoute = "intake@firm.test" | "documents@firm.test" | "deadlines@firm.test";

export type IntakeDecision = {
  route: InboxRoute;
  urgency: "normal" | "today";
  subject: string;
};

const DEMO_RECIPIENT = "chenhua@changba.com";

export function decideIntakeRoute(input: IntakeForm): IntakeDecision {
  if (input.matterType === "signed_document_delivery") {
    return {
      route: "documents@firm.test",
      urgency: "normal",
      subject: `Signed document: ${input.matterRef}`
    };
  }

  if (input.matterType === "deadline_follow_up") {
    const deadline = input.deadlineIso ? new Date(input.deadlineIso).getTime() : Number.POSITIVE_INFINITY;
    const submitted = new Date(input.submittedAt).getTime();
    const hoursUntilDeadline = (deadline - submitted) / (1000 * 60 * 60);
    const urgency = hoursUntilDeadline <= 48 ? "today" : "normal";
    return {
      route: "deadlines@firm.test",
      urgency,
      subject: urgency === "today" ? `Deadline follow-up today: ${input.matterRef}` : `Deadline follow-up: ${input.matterRef}`
    };
  }

  return {
    route: "intake@firm.test",
    urgency: "normal",
    subject: `New matter intake: ${input.matterRef}`
  };
}

function renderHtml(input: IntakeForm, decision: IntakeDecision): string {
  const companyLine = input.company ? `<p><b>Company:</b> ${input.company}</p>` : "";
  const deadlineLine = input.deadlineIso ? `<p><b>Deadline:</b> ${input.deadlineIso}</p>` : "";
  const signedDocLine = input.signedDocumentUrl ? `<p><b>Signed document:</b> <a href="${input.signedDocumentUrl}">${input.signedDocumentUrl}</a></p>` : "";

  return [
    `<h1>${decision.subject}</h1>`,
    `<p><b>Route:</b> ${decision.route}</p>`,
    `<p><b>Urgency:</b> ${decision.urgency}</p>`,
    `<p><b>Name:</b> ${input.fullName}</p>`,
    `<p><b>Email:</b> ${input.email}</p>`,
    companyLine,
    `<p><b>Matter type:</b> ${input.matterType}</p>`,
    `<p><b>Matter ref:</b> ${input.matterRef}</p>`,
    deadlineLine,
    signedDocLine,
    `<p><b>Message:</b></p>`,
    `<p>${input.message}</p>`
  ].join("\n");
}

export async function routeLegalIntake(rawBody: unknown): Promise<{ messageId: string; route: InboxRoute; urgency: "normal" | "today" }> {
  const input = intakeSchema.parse(rawBody);

  try {
    await infrai.captcha.verify({
      widget_record_id: input.captchaWidgetRecordId,
      token: input.captchaToken,
      ip: input.ip,
      action: "legal_contact_form",
      score_threshold: 0.5
    });
  } catch (error) {
    if (error instanceof InfraiError && error.status >= 400 && error.status < 500) {
      const rejected = new Error("captcha rejected");
      rejected.name = "CaptchaRejectedError";
      throw rejected;
    }
    throw error;
  }

  const decision = decideIntakeRoute(input);
  const result = await infrai.email.send(
    {
      to: DEMO_RECIPIENT,
      subject: decision.subject,
      html: renderHtml(input, decision)
    },
    { "Idempotency-Key": input.submissionId }
  );

  return {
    messageId: result.data.message_id,
    route: decision.route,
    urgency: decision.urgency
  };
}
