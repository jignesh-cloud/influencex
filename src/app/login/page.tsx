import { signIn } from "@/auth";
import { Button } from "@/components/ui/button";

const ERROR_MESSAGES: Record<string, string> = {
  AccessDenied:
    "Access denied. Your account isn't set up yet, or your email domain isn't authorized — contact a Group 8A admin.",
  Configuration: "Sign-in is temporarily misconfigured. Contact a Group 8A admin.",
  Default: "Something went wrong signing you in. Please try again.",
};

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const params = await searchParams;
  const callbackUrl = typeof params.callbackUrl === "string" ? params.callbackUrl : "/dashboard";
  const errorCode = typeof params.error === "string" ? params.error : undefined;
  const errorMessage = errorCode ? (ERROR_MESSAGES[errorCode] ?? ERROR_MESSAGES.Default) : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm space-y-6 rounded-lg border border-neutral-200 bg-white p-8 shadow-sm">
        <div className="space-y-1 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-pink-600">Group 8A</p>
          <h1 className="text-xl font-semibold text-neutral-900">Creator Sourcing &amp; Campaign Platform</h1>
          <p className="text-sm text-neutral-500">Internal access only.</p>
        </div>

        {errorMessage ? (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</p>
        ) : null}

        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: callbackUrl });
          }}
        >
          <Button type="submit" className="w-full">
            Sign in with Google Workspace
          </Button>
        </form>

        <p className="border-t border-neutral-100 pt-4 text-center text-xs text-neutral-500">
          Invited as a creator? This page is for the Group 8A team only — check your email for your
          personal join link.
        </p>
      </div>
    </div>
  );
}
