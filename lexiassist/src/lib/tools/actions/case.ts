// src/app/tools/actions/case.ts
"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { revalidatePath } from "next/cache";

export async function createNewCase(title: string = "New Legal Inquiry") {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !(session.user as any).id) {
    return { success: false, error: "Unauthorized session context." };
  }

  const userId = (session.user as any).id;

  try {
    const newCase = await prisma.caseBrief.create({
        data: {
        title: title,
        status: "TRIAGE",
        rawDescription: "", // Satisfies the mandatory database field constraint
        client: {
            connect: { id: userId } // Establishes the safe foreign key relation mapping
        }
        },
    });

    // Purge the cache states for the dashboard views
    revalidatePath("/dashboard");
    
    return { success: true, caseId: newCase.id, caseBrief: newCase };
    } catch (error: any) {
    console.error("Critical case initialization failure:", error);
    return { success: false, error: "Failed to initialize case matrix." };
    }
}