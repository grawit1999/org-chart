"use client";
import { signIn } from "next-auth/react";
export default function LoginButton({ retry }: { retry: boolean }) {
  return <button className="gbtn" onClick={() => signIn("google", { callbackUrl: "/" })}>{retry ? "Try again with Google" : "Continue with Google"}</button>;
}
