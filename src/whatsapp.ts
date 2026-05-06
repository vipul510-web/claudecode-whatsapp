import 'dotenv/config';

const BASE_URL = 'https://www.gaviventures.com/api/v1';
const MAX_CHUNK = 4000;

export async function sendMessage(to: string, text: string): Promise<void> {
  const chunks = chunkText(text, MAX_CHUNK);
  for (const chunk of chunks) {
    await post(to, chunk);
  }
}

async function post(to: string, text: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/messages/send`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.GAVI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ to, text }),
  });
  if (!res.ok) {
    throw new Error(`Gavi API ${res.status}: ${await res.text()}`);
  }
}

// Split at newlines where possible to avoid mid-word cuts
function chunkText(text: string, max: number): string[] {
  if (text.length <= max) return [text];
  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > max) {
    let cut = remaining.lastIndexOf('\n', max);
    if (cut < max * 0.5) cut = max;
    chunks.push(remaining.slice(0, cut).trimEnd());
    remaining = remaining.slice(cut).trimStart();
  }
  if (remaining) chunks.push(remaining);
  return chunks;
}
