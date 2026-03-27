import { EvalCase, KaiResponse } from '../types';

export async function runWithHttpAdapter(evalCase: EvalCase): Promise<KaiResponse> {
  const baseUrl = process.env.KAI_EVAL_BASE_URL;
  if (!baseUrl) {
    throw new Error('KAI_EVAL_BASE_URL is required when adapter=http');
  }

  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/eval`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      caseId: evalCase.id,
      scenario: evalCase.scenario,
      input: evalCase.input,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP adapter failed: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as KaiResponse;
}
