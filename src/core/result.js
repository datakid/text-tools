export function Ok(value) {
  return { ok: true, value };
}

export function Err(error) {
  return { ok: false, error };
}

export class OpError extends Error {
  constructor(code, message, hint = '', stepId = null) {
    super(message);
    this.name = 'OpError';
    this.code = code;
    this.hint = hint;
    this.stepId = stepId;
  }
}
