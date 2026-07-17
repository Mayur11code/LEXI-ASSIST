import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

import ClientDashboard from "./ClientDashboard";
import LawyerDashboard from "./LawyerDashboard";
import { getLawyerDashboardData } from "@/app/actions/lawyer";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !(session.user as any).id) {
    redirect("/login");
  }

  const userId = (session.user as any).id;

  // 1. Fetch user role
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  });

  if (!user) redirect("/login");

  // 2. Route to LAWYER Dashboard
  if (user.role === "LAWYER") {
    const data = await getLawyerDashboardData();
    const cases = data.success && data.cases ? data.cases : [];
    
    return <LawyerDashboard initialCases={cases} />;
  }

  // 3. Route to CLIENT Dashboard
  const existingCases = await prisma.caseBrief.findMany({
    where: { clientId: userId },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, status: true, createdAt: true },
  });

  return <ClientDashboard initialCases={existingCases} />;
}