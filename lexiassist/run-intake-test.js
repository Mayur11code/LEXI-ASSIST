import { z } from 'zod';
import { Pusher } from 'pusher-js'; // Fixed import syntax
import 'dotenv/config'; 

const NGROK_TUNNEL_URL = 'https://prosubscription-nonprolifically-jimmie.ngrok-free.dev';

async function executeIntakeIntegrationTest() {
  const targetUrl = `${NGROK_TUNNEL_URL.replace(/\/$/, '')}/api/agent/init`;
  
  const testPayload = {
    prompt: "I leased a corporate office space in Delhi and the landlord is arbitrarily holding my security deposit. I need a full legal risk assessment done, and I also need you to immediately run a match for a verified lawyer who can handle this.",
    clientId: "668047ef-af10-4bc9-a9c7-c7004823a577",
    hasPdf: false,
    metadata: {
      jurisdiction: "Delhi",
      legalDomain: "Corporate",
      estimatedBudget: 50000
    }
  };

  console.log(`\x1b[36m[TEST] 1. Initializing connection to Intake Front Door: ${targetUrl}\x1b[0m`);
  
  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload),
    });

    const status = response.status;
    const data = await response.json();

    if (status !== 202) {
      console.error(`\n\x1b[31m✗ FAILURE: Server rejected request with status ${status}\x1b[0m`);
      console.error(data);
      process.exit(1);
    }

    console.log(`\x1b[32m✓ Front Door Accepted. Assigned Session ID: ${data.sessionId}\x1b[0m`);
    console.log(`\x1b[36m[TEST] 2. Connecting to Pusher WebSocket to monitor background loop...\x1b[0m\n`);

    // Initialize Pusher exactly as the frontend would
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
    });

    const channelName = `session-${data.sessionId}`;
    const channel = pusher.subscribe(channelName);

    // Set a safety timeout so the test doesn't hang forever if the backend crashes
    const timeout = setTimeout(() => {
      console.error('\n\x1b[31m✗ TIMEOUT: No final response received within 60 seconds. Check QStash logs.\x1b[0m');
      pusher.disconnect();
      process.exit(1);
    }, 60000);

    // Listen for intermediate tool executions
    channel.bind('agent:progress', (eventData) => {
      console.log(`\x1b[33m[AGENT PROGRESS]\x1b[0m ${eventData.step}`);
    });

    // Listen for the terminal completion state
    channel.bind('agent:completed', (eventData) => {
      clearTimeout(timeout);
      
      if (eventData.status === 'FAILED') {
        console.error(`\n\x1b[31m✗ AGENT FAILED:\x1b[0m ${eventData.content}`);
        pusher.disconnect();
        process.exit(1);
      } else {
        console.log(`\n\x1b[32m✓ E2E PIPELINE SUCCESS! Final LLM Output:\x1b[0m\n`);
        console.log(eventData.content);
        
        console.log(`\n\x1b[35m[TEST] Database Check Reminder:\x1b[0m`);
        console.log(`Verify that CaseBrief and Lawyer matches are saved in Prisma Studio for Session ID: ${data.sessionId}`);
        
        pusher.disconnect();
        process.exit(0);
      }
    });

  } catch (error) {
    console.error('\n\x1b[31m✗ CRITICAL ERROR: Test execution failed\x1b[0m', error);
    process.exit(1);
  }
}

executeIntakeIntegrationTest();