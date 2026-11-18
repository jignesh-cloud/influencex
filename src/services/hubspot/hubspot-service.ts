import { env } from "@/lib/env";
import { callExternalService } from "@/lib/external-service";
import type {
  EmailSendResult,
  HubSpotService,
  SendAffiliateInviteInput,
  SendPitchEmailInput,
  UpsertContactInput,
  UpsertContactResult,
} from "@/services/hubspot/types";

const HUBSPOT_API_BASE = "https://api.hubapi.com";

async function hubspotFetch(path: string, init: RequestInit): Promise<Response> {
  const response = await fetch(`${HUBSPOT_API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.HUBSPOT_API_KEY}`,
      ...init.headers,
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    const error = new Error(`HubSpot API ${response.status}: ${body}`) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }

  return response;
}

async function sendSingleEmail(
  serviceName: string,
  emailId: string | undefined,
  message: { to: string },
  customProperties?: Record<string, unknown>,
): Promise<EmailSendResult> {
  if (!emailId) {
    throw new Error(`${serviceName}: template ID is not configured.`);
  }

  try {
    const response = await callExternalService(serviceName, () =>
      hubspotFetch("/marketing/v3/transactional/single-email/send", {
        method: "POST",
        body: JSON.stringify({ emailId, message, ...(customProperties ? { customProperties } : {}) }),
      }),
    );

    const data = (await response.json()) as { statusId?: string };
    return { status: "sent", externalMessageId: data.statusId };
  } catch (error) {
    console.error(`[HubSpotService] ${serviceName} failed:`, error);
    return { status: "failed" };
  }
}

export class HubSpotServiceImpl implements HubSpotService {
  async upsertContact(input: UpsertContactInput): Promise<UpsertContactResult> {
    const response = await callExternalService("hubspot.upsertContact", () =>
      hubspotFetch("/crm/v3/objects/contacts/batch/upsert", {
        method: "POST",
        body: JSON.stringify({
          inputs: [
            {
              id: input.email,
              idProperty: "email",
              properties: {
                email: input.email,
                ...(input.firstName ? { firstname: input.firstName } : {}),
              },
            },
          ],
        }),
      }),
    );

    const data = (await response.json()) as { results?: Array<{ id: string }> };
    const contactId = data.results?.[0]?.id;
    if (!contactId) {
      throw new Error("HubSpot upsertContact response did not include a contact id.");
    }

    return { hubspotContactId: contactId };
  }

  async sendAffiliateInviteEmail(input: SendAffiliateInviteInput): Promise<EmailSendResult> {
    return sendSingleEmail("hubspot.sendAffiliateInviteEmail", env.HUBSPOT_INVITE_TEMPLATE_ID, { to: input.toEmail }, {
      onboarding_url: input.onboardingUrl,
    });
  }

  async sendPitchEmail(input: SendPitchEmailInput): Promise<EmailSendResult> {
    // Generic vs. custom pitch is the same template with a personalization
    // token — HubSpot's Single-Send API doesn't take arbitrary email bodies.
    return sendSingleEmail("hubspot.sendPitchEmail", env.HUBSPOT_PITCH_TEMPLATE_ID, { to: input.toEmail }, {
      creator_name: input.creatorName,
      campaign_name: input.campaignName,
      pitch_message: input.pitchMessage ?? "",
    });
  }
}
