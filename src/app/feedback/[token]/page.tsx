import { notFound } from "next/navigation";
import { getFeedbackLinkState, getPublicShortlist } from "@/features/feedback/queries";
import { PublicFeedbackPage } from "@/features/feedback/components/public-feedback-page";

function InactiveLinkMessage({ message }: { message: string }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 text-center">
      <p className="text-xs font-semibold uppercase tracking-wide text-pink-600">Group 8A</p>
      <p className="mt-2 text-neutral-600">{message}</p>
    </div>
  );
}

export default async function FeedbackTokenPage({
  params,
}: PageProps<"/feedback/[token]">) {
  const { token } = await params;
  const state = await getFeedbackLinkState(token);

  if (state.status === "not_found") {
    notFound();
  }
  if (state.status === "revoked") {
    return <InactiveLinkMessage message="This feedback link has been revoked. Please ask Group 8A for a new link." />;
  }
  if (state.status === "expired") {
    return <InactiveLinkMessage message="This feedback link has expired. Please ask Group 8A for a new link." />;
  }

  const creators = await getPublicShortlist(state.campaignId);

  return (
    <PublicFeedbackPage
      token={token}
      campaignName={state.campaignName}
      showPricing={state.showPricing}
      creators={creators}
    />
  );
}
