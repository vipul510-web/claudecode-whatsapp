import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import crypto from 'crypto';
import { processWithClaude } from './claude.js';
import { sendMessage } from './whatsapp.js';

interface RawRequest extends Request {
  rawBody?: Buffer;
}

const app = express();

// Capture raw body for HMAC verification before JSON parsing
app.use(
  express.json({
    verify: (req: RawRequest, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

function signatureValid(rawBody: Buffer, sig: string, timestamp: string): boolean {
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret) return true; // no secret configured — skip verification
  if (!sig) return false;

  // Gavi signs: HMAC-SHA256(secret, timestamp + "." + body), hex-encoded
  const signed = timestamp ? `${timestamp}.${rawBody.toString()}` : rawBody.toString();
  const expected = crypto.createHmac('sha256', secret).update(signed).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
  } catch {
    return false;
  }
}

app.post('/webhook', async (req: RawRequest, res: Response) => {
  const sig = req.headers['x-gaviventures-signature'] as string;
  const timestamp = req.headers['x-gaviventures-timestamp'] as string ?? '';
  if (!signatureValid(req.rawBody!, sig, timestamp)) {
    res.status(401).json({ error: 'Invalid signature' });
    return;
  }

  const { event, data } = req.body as { event: string; data: any };

  // Acknowledge immediately so Gavi doesn't retry
  res.json({ status: 'ok' });

  if (event !== 'message.received') return;

  const from: string = data?.from;
  const text: string = data?.text?.body;
  if (!from || !text) return;

  console.log(`[${new Date().toISOString()}] ${from}: ${text.slice(0, 120)}`);

  try {
    const reply = await processWithClaude(text);
    await sendMessage(from, reply);
    console.log(`[${new Date().toISOString()}] Replied to ${from} (${reply.length} chars)`);
  } catch (err) {
    console.error('Error handling message:', err);
    await sendMessage(from, 'Something went wrong. Please try again.').catch(() => {});
  }
});

app.get('/health', (_req, res) => res.json({ status: 'ok', workDir: process.env.WORK_DIR }));

const PORT = parseInt(process.env.PORT ?? '3001', 10);
app.listen(PORT, () => {
  console.log(`WhatsApp → Claude bridge on port ${PORT}`);
  console.log(`Work directory: ${process.env.WORK_DIR ?? process.cwd()}`);
});
