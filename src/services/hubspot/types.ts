export interface UpsertContactInput {
  email: string;
  firstName?: string;
}

export interface UpsertContactResult {
  hubspotContactId: string;
}

export interface SendAffiliateInviteInput {
  hubspotContactId: string;
  toEmail: string;
  /** The creator's onboarding-page URL — embedded in the email template as the "join" link. */
  onboardingUrl: string;
}

export type EmailSendStatus = "sent" | "failed" | "bounced";

export interface EmailSendResult {
  status: EmailSendStatus;
  externalMessageId?: string;
}

export interface SendPitchEmailInput {
  hubspotContactId: string;
  toEmail: string;
  creatorName: string;
  campaignName: string;
  /** Present = custom pitch copy; absent = the template's generic default pitch. */
  pitchMessage?: string;
}

/**
 * HubSpot is used for exactly two things: the sourcing pitch email and the
 * affiliate program invitation email. Not a general marketing-automation
 * client — do not extend this interface beyond that without revisiting scope.
 */
export interface HubSpotService {
  upsertContact(input: UpsertContactInput): Promise<UpsertContactResult>;
  sendAffiliateInviteEmail(input: SendAffiliateInviteInput): Promise<EmailSendResult>;
  sendPitchEmail(input: SendPitchEmailInput): Promise<EmailSendResult>;
}
