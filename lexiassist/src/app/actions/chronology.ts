"use server";

import { prisma } from "@/lib/prisma";

export async function getCaseChronology(caseBriefId: string) {
  try {
    // We strictly select ONLY the aiTimeline column. No heavy documents attached.
    const caseBrief = await prisma.caseBrief.findUnique({
      where: { id: caseBriefId },
      select: { aiTimeline: true }
    });

    if (!caseBrief) {
      return { success: false, error: "Case matrix not found." };
    }

    return { success: true, timeline: caseBrief.aiTimeline };
  } catch (error) {
    console.error("Failed to fetch chronology:", error);
    return { success: false, error: "Database mapping failed." };
  }
}