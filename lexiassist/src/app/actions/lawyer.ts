// src/app/actions/lawyer.ts
"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { revalidatePath } from "next/cache";

//LAWYER ONBOARDING (Your existing function
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
    // Run a sequential transaction to ensure database structural integrity
    await prisma.$transaction([
      // Upgrade the global user record role to LAWYER
      prisma.user.update({
        where: { id: userId },
        data: { role: "LAWYER" },
      }),
      // Populate the detailed LawyerProfile metadata structure
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

    // Force Next.js to purge cached states of the dashboard views
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

// 2. CASE ASSIGNMENT (function for Tab 2)
export async function assignLawyerToCase(caseBriefId: string, lawyerId: string) {
  try {
    await prisma.caseBrief.update({
      where: { id: caseBriefId },
      data: { 
        lawyerId,
        status: "MATCHED" 
      },
    });

    // Force Next.js to purge cache so the dashboard immediately reflects the MATCHED status
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Failed to assign lawyer:", error);
    return { success: false, error: "Database mapping failed." };
  }
}