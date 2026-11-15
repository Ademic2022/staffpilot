"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { useMutation } from "urql";

import { AuthShell } from "@/components/auth/AuthShell";
import { Loading } from "@/components/ui";
import { graphql } from "@/gql";
import { errorMessage } from "@/lib/api";
import { useSession } from "@/lib/session";

const RedeemWelcomeDocument = graphql(`
  mutation RedeemWelcome($token: String!) {
    redeemWelcome(token: $token) { me { mfaSetupRequired } errors { message } }
  }
`);

/** Where a new company's owner arrives from sign-up: the hand-off token becomes a session here. */
function Welcome() {
  const params = useSearchParams();
  const router = useRouter();
  const { reset } = useSession();
  const [, redeem] = useMutation(RedeemWelcomeDocument);
  const [problem, setProblem] = useState<string>();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void redeem({ token: params.get("token") ?? "" }).then((result) => {
      const failed = errorMessage(result.error) ?? result.data?.redeemWelcome.errors[0]?.message;
      if (failed) return setProblem(failed);
      reset();
      // New companies ask admins for two-step sign-in, so the owner starts with that.
      router.replace(result.data?.redeemWelcome.me?.mfaSetupRequired ? "/account?welcome=1" : "/home");
    });
  }, [params, redeem, reset, router]);

  return (
    <AuthShell title={problem ? "Almost there" : "Setting up your workspace"} subtitle={problem}>
      {problem ? <Link href="/login" className="font-semibold text-brand-ink hover:underline">Go to sign in</Link> : <Loading shape="form" />}
    </AuthShell>
  );
}

export default function WelcomePage() {
  return (
    <Suspense>
      <Welcome />
    </Suspense>
  );
}
