// src/app/actions/lawyer.ts
"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { revalidatePath } from "next/cache";
import { pusher } from "@/lib/pusher/server"; // 🔴 INJECTED PUSHER

// ==========================================
// 1. LAWYER ONBOARDING
// ==========================================

export async function onboardLawyer(formData: {
  specialization: string[];
  jurisdiction: string;
  experienceYrs: number;
}) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !(session.user as any).id) {
    return { success: false, error: "Unauthorized session mapping." };
  }

  const userId = (session.user as any).id;

  try {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { role: "LAWYER" },
      }),
      prisma.lawyerProfile.create({
        data: {
          userId: userId,
          specialization: formData.specialization,
          jurisdiction: formData.jurisdiction,
          experienceYrs: formData.experienceYrs,
          isAvailable: true,
        },
      }),
    ]);

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Critical onboarding transaction failure:", error);
    return { 
      success: false, 
      error: error.code === "P2002" 
        ? "A professional lawyer profile already exists for this account record." 
        : "Failed to map operational profile onto the orchestration layer." 
    };
  }
}

// ==========================================
// 2. CASE ASSIGNMENT
// ==========================================
export async function assignLawyerToCase(caseBriefId: string, lawyerId: string) {
  try {
    await prisma.caseBrief.update({
      where: { id: caseBriefId },
      data: { 
        lawyerId,
        status: "MATCHED" 
      },
    });

    // Broadcast MATCHED status
    await pusher.trigger(`case-${caseBriefId}`, 'status-update', { status: "MATCHED" });
    revalidatePath("/dashboard");
    
    return { success: true };
  } catch (error) {
    console.error("Failed to assign lawyer:", error);
    return { success: false, error: "Database mapping failed." };
  }
}

// ==========================================
// 3. LAWYER DASHBOARD DATA
// ==========================================
export async function getLawyerDashboardData() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !(session.user as any).id) {
    return { success: false, error: "Unauthorized" };
  }

  const userId = (session.user as any).id;

  try {
    const cases = await prisma.caseBrief.findMany({
      where: { 
        lawyer: { userId: userId } 
      },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        status: true,
        rawDescription: true, 
        updatedAt: true,
        client: { 
          select: { name: true, email: true }
        }
      }
    });

    return { success: true, cases };
  } catch (error) {
    console.error("Failed to fetch lawyer cases:", error);
    return { success: false, error: "Failed to load case matrix." };
  }
}

// ==========================================
// 4. ACCEPT CASE ACTION
// ==========================================
export async function acceptCase(caseId: string) {
  try {
    await prisma.caseBrief.update({
      where: { id: caseId },
      data: { status: "REVIEW" }, 
    });

    // Broadcast REVIEW status
    await pusher.trigger(`case-${caseId}`, 'status-update', { status: "REVIEW" });
    revalidatePath("/dashboard");
    
    return { success: true };
  } catch (error) {
    console.error("Failed to accept case:", error);
    return { success: false, error: "Database mapping failed." };
  }
}

// ==========================================
// 5. RESOLVE CASE ACTION
// ==========================================
export async function resolveCase(caseBriefId: string) {
  try {
    const updatedCase = await prisma.caseBrief.update({
      where: { id: caseBriefId },
      data: { status: "RESOLVED" }
    });

    // Broadcast RESOLVED status
    await pusher.trigger(`case-${caseBriefId}`, 'status-update', { status: "RESOLVED" });
    
    return { success: true, caseBrief: updatedCase };
  } catch (error) {
    console.error("[DB ERROR] Failed to resolve case:", error);
    return { success: false, error: "Failed to update case status in database." };
  }
}