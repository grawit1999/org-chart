import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import Google from "next-auth/providers/google";

// JWT session only: no database, no adapter, nothing about users is stored server-side.
export const authOptions: NextAuthOptions = {
  providers: [Google({ clientId: process.env.GOOGLE_CLIENT_ID ?? "", clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "" })],
  session: { strategy: "jwt" },
  pages: { signIn: "/login", error: "/login" },
};
export const currentUser = async () => (await getServerSession(authOptions))?.user ?? null;
