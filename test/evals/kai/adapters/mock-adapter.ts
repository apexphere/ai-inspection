import { EvalCase, KaiResponse } from '../types';

export async function runWithMockAdapter(evalCase: EvalCase): Promise<KaiResponse> {
  return evalCase.mockResponse;
}
