// src/app/api/agent/execute-tool/route.ts
import { NextResponse } from 'next/server';
import { Receiver } from '@upstash/qstash';
import { 
  extractCaseChronologySchema, 
  generatePreBriefRiskSchema, 
  generateDocumentRedlinesSchema, 
  matchVerifyLawyerSchema 
} from '@/lib/schemas/tools/legal-schemas'

// Import our decoupled tool actions
import { executeExtractCaseChronology } from '@/lib/tools/actions/extract-case-chronology';
import { executeGeneratePreBriefRisk } from '@/lib/tools/actions/generate-pre-brief-risk';
import { executeGenerateDocumentRedlines } from '@/lib/tools/actions/generate-document-redlines';
import { executeMatchVerifyLawyer } from '@/lib/tools/actions/match-verify-lawyer';

const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
});

export async function POST(req: Request) {
  try {
    // 1. Enforce Cryptographic Signature Verification (Zero-Trust)
    const signature = req.headers.get('upstash-signature');
    const rawBody = await req.text();
    
    const isValid = await receiver.verify({
      signature: signature || '',
      body: rawBody,
    }).catch(() => false);

    if (!isValid) {
      return new Response('Unauthorized Webhook Signature', { status: 401 });
    }

    // 2. Destructure the core stateless orchestration payload
    const { sessionId, clientId, messages, toolCall, currentStep, metadata } = JSON.parse(rawBody);
    const { toolName, toolCallId, args } = toolCall;

    let toolExecutionResult = {};

    // 3. Decentralized Execution Router with strict Zod parsing
    switch (toolName) {
      case 'extractCaseChronology': {
        const verifiedArgs = extractCaseChronologySchema.parse(args);
        toolExecutionResult = await executeExtractCaseChronology(verifiedArgs);
        break;
      }

      case 'generatePreBriefRisk': {
        const verifiedArgs = generatePreBriefRiskSchema.parse(args);
        toolExecutionResult = await executeGeneratePreBriefRisk(verifiedArgs);
        break;
      }

      case 'generateDocumentRedlines': {
        const verifiedArgs = generateDocumentRedlinesSchema.parse(args);
        toolExecutionResult = await executeGenerateDocumentRedlines(verifiedArgs);
        break;
      }

      case 'matchVerifyLawyer': {
        const verifiedArgs = matchVerifyLawyerSchema.parse(args);
        toolExecutionResult = await executeMatchVerifyLawyer(verifiedArgs);
        break;
      }

      default:
        return NextResponse.json({ error: `Unknown tool requested: ${toolName}` }, { status: 400 });
    }

    // 4. Construct standard AI SDK observation message schema
    const observationMessage = {
      role: 'tool',
      content: [
        {
          toolCallId,
          toolName,
          result: toolExecutionResult,
        },
      ],
    };

    // 5. Dynamic Tunnel & Production Host Resolution
// 1. Check for proxy headers (like ngrok or Vercel) first, then standard host
const host = req.headers.get('x-forwarded-host') || req.headers.get('host');

// 2. Determine protocol based on environment
const protocol = host && host.includes('localhost') ? 'http://' : 'https://';

// 3. Combine dynamically, but fallback to your .env file if headers are stripped
const currentAppUrl = host 
  ? `${protocol}${host}` 
  : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');

    // 6. Chain control state machine directly back to the primary orchestration Loop handler
    await fetch(`https://qstash.upstash.io/v1/publish/${currentAppUrl}/api/agent/loop`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.QSTASH_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId,
        clientId,
        messages: [...messages, observationMessage],
        currentStep,
        metadata,
      }),
    });

    return new Response('Observation complete. Chaining back to loop routing brain.', { status: 200 });

  } catch (error: any) {
    console.error('[EXECUTE-TOOL ERROR] Asynchronous execution breakdown:', error);
    return NextResponse.json(
      { error: 'Internal operation failure', details: error.message }, 
      { status: 500 }
    );
  }
}