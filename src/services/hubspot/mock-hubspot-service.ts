import crypto from "node:crypto";
import type {
  EmailSendResult,
  HubSpotService,
  SendAffiliateInviteInput,
  SendPitchEmailInput,
  UpsertContactInput,
  UpsertContactResult,
} from "@/services/hubspot/types";

export class MockHubSpotService implements HubSpotService {
  async upsertContact(input: UpsertContactInput): Promise<UpsertContactResult> {
    const hubspotContactId = `mock-contact-${crypto.createHash("sha1").update(input.email).digest("hex").slice(0, 12)}`;
    console.log(`[MockHubSpotService] upsertContact: ${input.email} -> ${hubspotContactId}`);
    return { hubspotContactId };
  }

  async sendAffiliateInviteEmail(input: SendAffiliateInviteInput): Promise<EmailSendResult> {
    console.log(
      `[MockHubSpotService] sendAffiliateInviteEmail -> ${input.toEmail} (contact ${input.hubspotContactId}), onboarding: ${input.onboardingUrl}`,
    );
    return { status: "sent", externalMessageId: `mock-message-${crypto.randomBytes(6).toString("hex")}` };
  }

  async sendPitchEmail(input: SendPitchEmailInput): Promise<EmailSendResult> {
    console.log(
      `[MockHubSpotService] sendPitchEmail -> ${input.toEmail} for ${input.campaignName} (${input.pitchMessage ? "custom" : "generic"} pitch)`,
    );
    return { status: "sent", externalMessageId: `mock-message-${crypto.randomBytes(6).toString("hex")}` };
  }
}
