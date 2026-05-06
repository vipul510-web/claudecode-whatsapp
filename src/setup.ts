/**
 * Run once to register your webhook with Gavi.
 * Usage: npm run setup-webhook
 *
 * Prerequisites: GAVI_API_KEY and WEBHOOK_URL must be set in .env
 */
import 'dotenv/config';

const BASE_URL = 'https://www.gaviventures.com/api/v1';

async function main() {
  const apiKey = process.env.GAVI_API_KEY;
  const webhookUrl = process.env.WEBHOOK_URL;

  if (!apiKey || apiKey.startsWith('gv_your')) {
    console.error('Set GAVI_API_KEY in your .env file first.');
    process.exit(1);
  }
  if (!webhookUrl || webhookUrl.includes('your-domain')) {
    console.error('Set WEBHOOK_URL in your .env file first (public URL where this server is reachable).');
    process.exit(1);
  }

  console.log(`Registering webhook at: ${webhookUrl}/webhook`);

  const res = await fetch(`${BASE_URL}/webhooks`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: `${webhookUrl}/webhook`,
      events: ['message.received'],
    }),
  });

  const body = await res.json() as any;

  if (!res.ok) {
    console.error('Failed to register webhook:', body);
    process.exit(1);
  }

  console.log('\nWebhook registered!');
  console.log(`ID:     ${body.id}`);
  console.log(`Secret: ${body.secret}`);
  console.log('\nAdd this line to your .env:');
  console.log(`WEBHOOK_SECRET=${body.secret}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
