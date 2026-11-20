import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import OrgChart from "@/components/OrgChart";

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  return <OrgChart user={{ name: session.user.name ?? "User", image: session.user.image ?? null }} />;
}
