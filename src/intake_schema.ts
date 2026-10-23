import { z } from "zod";

export const intakeSchema = z.object({
  submissionId: z.string().min(8),
  submittedAt: z.string().datetime(),
  captchaWidgetRecordId: z.string().min(1),
  captchaToken: z.string().min(1),
  ip: z.string().min(3),
  fullName: z.string().min(2),
  email: z.string().email(),
  company: z.string().min(1).optional(),
  matterType: z.enum(["matter_intake", "signed_document_delivery", "deadline_follow_up"]),
  matterRef: z.string().min(3),
  deadlineIso: z.string().datetime().optional(),
  signedDocumentUrl: z.string().url().optional(),
  message: z.string().min(10)
});

export type IntakeForm = z.infer<typeof intakeSchema>;
