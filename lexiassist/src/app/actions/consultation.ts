"use server";

import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

export async function getOrInitializeConsultation(caseBriefId: string) {
  try {
    // 1. Check if a room already exists for this case
    let consultation = await prisma.consultation.findFirst({
      where: { caseBriefId, isCompleted: false },
    });

    // 2. If no active room exists, initialize a new secure hash
    if (!consultation) {
      const secureRoomHash = `room-${randomBytes(8).toString("hex")}`;
      
      consultation = await prisma.consultation.create({
        data: {
          caseBriefId,
          webrtcRoomId: secureRoomHash,
          scheduledAt: new Date(),
          isCompleted: false,
        },
      });
    }

    return { success: true, consultation };
  } catch (error) {
    console.error("[DB ERROR] Failed to orchestrate consultation room:", error);
    return { success: false, error: "Failed to initialize secure connection." };
  }
}

export async function markConsultationComplete(consultationId: string, caseBriefId: string) {
  try {
    await prisma.$transaction([
      prisma.consultation.update({
        where: { id: consultationId },
        data: { isCompleted: true },
      }),
      prisma.caseBrief.update({
        where: { id: caseBriefId },
        data: { status: "RESOLVED" } // Move case to resolved upon completion
      })
    ]);
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to close consultation." };
  }
}