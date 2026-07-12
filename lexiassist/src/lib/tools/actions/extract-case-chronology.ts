// src/lib/tools/actions/extract-case-chronology.ts
import { prisma } from '@/lib/prisma'; // Using your established DB singleton
import type { ExtractCaseChronologyInput } from '@/lib/schemas/tools/legal-schemas';

// Stored shape in CaseBrief.aiTimeline — NOT the tool's input schema.
// `verified` is computed server-side, never supplied by the model.
export type StoredKeyEvent = {
  eventDate: string;
  description: string;
  verifiableSourceCitation: string;
  verified: boolean;
};

export async function executeExtractCaseChronology(args: ExtractCaseChronologyInput) {
  
  // Step 1: Resolve the session and pull the full message history
  const session = await prisma.agentSession.findUnique({
    where: { id: args.caseSessionId },
    select: { caseBriefId: true, messages: true },
  });

  // Guard: Session must exist
  if (!session) {
    throw new Error(`AgentSession ${args.caseSessionId} not found — cannot store chronology.`);
  }

  // Guard: CaseBrief must already exist (Strict sequencing)
  if (!session.caseBriefId) {
    throw new Error(`No CaseBrief linked to session ${args.caseSessionId} — run generatePreBriefRisk first.`);
  }

 // Step 2: Build a single lowercased corpus from every message's content
  // This includes narrative, injected PDF text, and synthetic system messages.
  const messages = (session.messages as any[]) ?? [];
  const corpus = messages
    .map((m) => (typeof m.content === 'string' ? m.content : ''))
    .join('\n\n')
    .toLowerCase();

  // Step 3: Map events to the strict StoredKeyEvent shape and verify citations
  const verifiedEvents: StoredKeyEvent[] = args.keyEvents.map((event) => {
    const citation = event.verifiableSourceCitation.toLowerCase().trim();
    return {
      eventDate: event.eventDate,
      description: event.description,
      verifiableSourceCitation: event.verifiableSourceCitation,
      verified: citation.length > 0 && corpus.includes(citation),
    };
  });

  // Flag, don't reject: Log a warning if any citations failed strict matching
  const unverifiedCount = verifiedEvents.filter((e) => !e.verified).length;
  if (unverifiedCount > 0) {
    console.warn(`[CHRONOLOGY] ${unverifiedCount}/${verifiedEvents.length} events failed verification for session ${args.caseSessionId}.`);
  }

// Step 4: Write to the dedicated CaseBrief columns and return summary
  await prisma.caseBrief.update({
    where: { id: session.caseBriefId },
    data: {
      aiTimeline: verifiedEvents as any, 
      aiEntities: args.involvedParties,
    },
  });

  return {
    acknowledged: true,
    eventsStored: verifiedEvents.length,
    eventsVerified: verifiedEvents.length - unverifiedCount,
    eventsUnverified: unverifiedCount,
  };
}