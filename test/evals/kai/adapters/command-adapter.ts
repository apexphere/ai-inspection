import { spawn } from 'node:child_process';
import { EvalCase, KaiResponse } from '../types';

export async function runWithCommandAdapter(evalCase: EvalCase): Promise<KaiResponse> {
  const command = process.env.KAI_EVAL_COMMAND;
  if (!command) {
    throw new Error('KAI_EVAL_COMMAND is required when adapter=command');
  }

  return new Promise<KaiResponse>((resolve, reject) => {
    const child = spawn(command, { shell: true, stdio: ['pipe', 'pipe', 'pipe'] });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (err) => reject(err));

    child.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`Command adapter failed (${code}): ${stderr || stdout}`));
      }
      try {
        const parsed = JSON.parse(stdout) as KaiResponse;
        resolve(parsed);
      } catch (err) {
        reject(new Error(`Invalid JSON from command adapter: ${String(err)}\nstdout=${stdout}\nstderr=${stderr}`));
      }
    });

    child.stdin.write(JSON.stringify({
      caseId: evalCase.id,
      scenario: evalCase.scenario,
      input: evalCase.input,
    }));
    child.stdin.end();
  });
}
