"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/db/prisma";
import { requireUser } from "@/lib/auth";
import { env } from "@/lib/env";
import { logActivity } from "@/services/activity-log/log-activity";
import { getFeedbackLinkState } from "@/features/feedback/queries";
import { submitClientFeedbackSchema, type SubmitClientFeedbackInput } from "@/validators/feedback";

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function submitClientFeedback(
  token: string,
  campaignCreatorId: string,
  input: SubmitClientFeedbackInput,
) {
  const linkState = await getFeedbackLinkState(token);
  if (linkState.status !== "active") {
    return { error: "This feedback link is no longer active. Please ask Group 8A for a new link." };
  }

  const parsed = submitClientFeedbackSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const { reviewerName, reviewerEmail, preference, comment } = parsed.data;

  const campaignCreator = await prisma.campaignCreator.findUnique({ where: { id: campaignCreatorId } });
  if (!campaignCreator || campaignCreator.campaignId !== linkState.campaignId) {
    return { error: "This creator is no longer part of this campaign's shortlist." };
  }

  const existing = reviewerEmail
    ? await prisma.clientPreference.findFirst({
        where: { campaignCreatorId, reviewerEmail: { equals: reviewerEmail, mode: "insensitive" } },
      })
    : await prisma.clientPreference.findFirst({
        where: { campaignCreatorId, reviewerName: { equals: reviewerName, mode: "insensitive" }, reviewerEmail: null },
      });

  if (existing) {
    await prisma.clientPreference.update({
      where: { id: existing.id },
      data: { preference, comment: comment || null },
    });

    await logActivity({
      entityType: "client_preference",
      entityId: existing.id,
      actorType: "external_reviewer",
      actorName: reviewerName,
      action: "client_preference_updated",
      detail: {
        message: `${reviewerName} updated their feedback`,
        from: existing.preference,
        to: preference,
      },
    });
  } else {
    const created = await prisma.clientPreference.create({
      data: { campaignCreatorId, reviewerName, reviewerEmail: reviewerEmail || null, preference, comment: comment || null },
    });

    await logActivity({
      entityType: "client_preference",
      entityId: created.id,
      actorType: "external_reviewer",
      actorName: reviewerName,
      action: "client_preference_submitted",
      detail: { message: `${reviewerName} submitted feedback: ${preference}` },
    });

    // First feedback on this row — advance the pipeline stage. Client
    // feedback never sets a decision, only this one workflow transition.
    if (campaignCreator.workflowStatus === "shortlisted" || campaignCreator.workflowStatus === "sent_to_client") {
      await prisma.campaignCreator.update({
        where: { id: campaignCreatorId },
        data: { workflowStatus: "client_feedback_received" },
      });
    }
  }

  revalidatePath(`/campaigns/${linkState.campaignId}`);
  return { success: true };
}

export async function createFeedbackLink(campaignId: string, expiryDays: number = env.FEEDBACK_LINK_DEFAULT_EXPIRY_DAYS) {
  const user = await requireUser();

  const link = await prisma.clientFeedbackLink.create({
    data: {
      campaignId,
      token: generateToken(),
      expiresAt: new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000),
      createdById: user.id,
    },
  });

  await logActivity({
    entityType: "campaign",
    entityId: campaignId,
    actorType: "user",
    actorId: user.id,
    actorName: user.name,
    action: "feedback_link_created",
    detail: { message: `Client feedback link created`, linkId: link.id },
  });

  revalidatePath(`/campaigns/${campaignId}`);
  return link;
}

export async function revokeFeedbackLink(linkId: string) {
  const user = await requireUser();

  const link = await prisma.clientFeedbackLink.update({
    where: { id: linkId },
    data: { revokedAt: new Date() },
  });

  await logActivity({
    entityType: "campaign",
    entityId: link.campaignId,
    actorType: "user",
    actorId: user.id,
    actorName: user.name,
    action: "feedback_link_revoked",
    detail: { message: "Client feedback link revoked", linkId },
  });

  revalidatePath(`/campaigns/${link.campaignId}`);
}

export async function updateFeedbackLinkExpiration(linkId: string, newExpiresAt: string) {
  const user = await requireUser();

  const link = await prisma.clientFeedbackLink.update({
    where: { id: linkId },
    data: { expiresAt: new Date(newExpiresAt) },
  });

  await logActivity({
    entityType: "campaign",
    entityId: link.campaignId,
    actorType: "user",
    actorId: user.id,
    actorName: user.name,
    action: "feedback_link_expiration_changed",
    detail: { message: "Client feedback link expiration changed", linkId, newExpiresAt },
  });

  revalidatePath(`/campaigns/${link.campaignId}`);
}

export async function regenerateFeedbackLink(campaignId: string) {
  const user = await requireUser();

  const activeLinks = await prisma.clientFeedbackLink.findMany({
    where: { campaignId, revokedAt: null },
  });

  for (const link of activeLinks) {
    await prisma.clientFeedbackLink.update({ where: { id: link.id }, data: { revokedAt: new Date() } });
  }

  const newLink = await prisma.clientFeedbackLink.create({
    data: {
      campaignId,
      token: generateToken(),
      expiresAt: new Date(Date.now() + env.FEEDBACK_LINK_DEFAULT_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
      createdById: user.id,
    },
  });

  await logActivity({
    entityType: "campaign",
    entityId: campaignId,
    actorType: "user",
    actorId: user.id,
    actorName: user.name,
    action: "feedback_link_regenerated",
    detail: { message: "Client feedback link regenerated", linkId: newLink.id },
  });

  revalidatePath(`/campaigns/${campaignId}`);
  return newLink;
}
