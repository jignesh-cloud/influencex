import { notFound } from "next/navigation";
import { getOnboardingPageState } from "@/features/creator-onboarding/queries";
import { markOnboardingViewed } from "@/features/creator-onboarding/actions";
import { OnboardingPage } from "@/features/creator-onboarding/components/onboarding-page";

export default async function JoinTokenPage({
  params,
}: PageProps<"/join/[token]">) {
  const { token } = await params;
  const state = await getOnboardingPageState(token);

  if (state.status === "not_found") {
    notFound();
  }

  await markOnboardingViewed(token);

  return <OnboardingPage state={state} token={token} />;
}
