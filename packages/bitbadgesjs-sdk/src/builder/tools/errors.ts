export type ToolFailure = {
  code: string; retrySafe: false; nextAction: string;
  issues: { path: string; message: string }[];
};
export function toolFailure(error: unknown, code = 'tool_failed'): ToolFailure {
  const raw = error as { issues?: { path?: (string | number)[]; message?: string }[] };
  const issues = Array.isArray(raw?.issues) ? raw.issues.slice(0, 20).map(issue => ({ path: issue.path?.join('.') || '(root)', message: issue.message || 'Invalid value' })) : [{ path: '(root)', message: 'The operation could not be completed.' }];
  return { code: Array.isArray(raw?.issues) ? 'invalid_input' : code, retrySafe: false,
    nextAction: code === 'unknown_tool' ? 'Read get_capabilities before choosing an installed operation.' : 'Read the operation input schema, correct the reported fields, then recheck. For execution or submission errors, reconcile status before retrying.', issues };
}
