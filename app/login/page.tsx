import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import LoginButton from "@/components/LoginButton";

const MSG: Record<string, string> = {
  AccessDenied: "Sign-in was cancelled or this account is not allowed. Please try again.",
  OAuthCallback: "Sign-in was cancelled or interrupted. Please try again.",
};
export default async function Login({ searchParams }: { searchParams: { error?: string } }) {
  if ((await getServerSession(authOptions))?.user) redirect("/");
  const err = searchParams.error;
  return (
    <main className="login">
      <h1>Organization Chart</h1>
      <p>Sign in to explore the 1,000-person organization.</p>
      {err && <p role="alert" className="err">{MSG[err] ?? "Sign-in failed. Please try again."}</p>}
      <LoginButton retry={!!err} />
    </main>
  );
}
