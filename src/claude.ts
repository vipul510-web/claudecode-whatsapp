import { spawn } from 'child_process';
import { execFileSync } from 'child_process';

const WORK_DIR = process.env.WORK_DIR ?? process.cwd();
const TIMEOUT_MS = parseInt(process.env.CLAUDE_TIMEOUT_MS ?? String(5 * 60 * 1000), 10);

// Resolve the claude binary once at startup
function findClaude(): string {
  try {
    return execFileSync('which', ['claude'], { encoding: 'utf8' }).trim();
  } catch {
    return 'claude'; // fall back to PATH lookup at spawn time
  }
}

const CLAUDE_BIN = findClaude();

interface ClaudeJsonResult {
  result?: string;
  is_error?: boolean;
  subtype?: string;
}

export async function processWithClaude(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    let stdout = '';
    let stderr = '';
    let killed = false;

    const child = spawn(
      CLAUDE_BIN,
      [
        '--print',
        '--dangerously-skip-permissions',
        '--output-format', 'json',
        '--no-session-persistence',
        prompt,
      ],
      {
        cwd: WORK_DIR,
        env: process.env,
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );

    const timer = setTimeout(() => {
      killed = true;
      child.kill('SIGTERM');
      reject(new Error('Claude timed out after 5 minutes'));
    }, TIMEOUT_MS);

    child.stdout?.on('data', (d: Buffer) => { stdout += d.toString(); });
    child.stderr?.on('data', (d: Buffer) => { stderr += d.toString(); });

    child.on('close', (code) => {
      clearTimeout(timer);
      if (killed) return;

      if (code !== 0) {
        reject(new Error(`Claude exited ${code}: ${stderr.slice(0, 300)}`));
        return;
      }

      try {
        const parsed = JSON.parse(stdout) as ClaudeJsonResult;
        if (parsed.is_error) {
          reject(new Error(`Claude error: ${parsed.result ?? 'unknown'}`));
        } else {
          resolve(parsed.result?.trim() || 'Done.');
        }
      } catch {
        // If JSON parsing fails, return raw text output
        resolve(stdout.trim() || 'Done.');
      }
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      if (!killed) reject(err);
    });
  });
}
