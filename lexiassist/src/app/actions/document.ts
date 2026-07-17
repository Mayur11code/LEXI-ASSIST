"use server";

import { prisma } from "@/lib/prisma"; 

// ==========================================
// 1. UPLOAD & SAVE DOCUMENT
// ==========================================
export async function saveDocumentRecord(fileUrl: string, caseBriefId: string) {
  try {
    let validCaseBriefId = caseBriefId;

    // Dev Fallback: Map to an active case if the UI hasn't fully registered the ID
    if (validCaseBriefId === "test-case-id") {
      const activeBrief = await prisma.caseBrief.findFirst();
      
      if (activeBrief) {
        validCaseBriefId = activeBrief.id;
      } else {
        return { 
          success: false, 
          error: "Database constraint error: No active Case Brief found to attach this document to." 
        };
      }
    }

    // Strict Insertion: Creates the DB row and generates the UUID that the AI needs
    const newDoc = await prisma.document.create({
      data: {
        fileUrl: fileUrl,
        caseBriefId: validCaseBriefId, 
        extractedText: "Pending extraction...", 
      },
    });

    return { success: true, document: newDoc };
  } catch (error) {
    console.error("[DB ERROR] Failed to save document:", error);
    return { success: false, error: "Failed to persist document record in database." };
  }
}

// ==========================================
// 2. FETCH DOCUMENT FOR REDLINE VIEWER
// ==========================================
export async function getCaseDocument(caseBriefId: string) {
  try {
    // Fetches the most recent document payload, including the AI-generated redlines JSON blob
    const document = await prisma.document.findFirst({
      where: { caseBriefId },
      orderBy: { createdAt: "desc" },
    });

    if (!document) {
      return { success: false, error: "No documents mapped to this specific case." };
    }

    return { success: true, document };
  } catch (error) {
    console.error("[DB ERROR] Failed to fetch document:", error);
    return { success: false, error: "Database retrieval failed." };
  }
}