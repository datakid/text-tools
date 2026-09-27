const TYPES = {
  int: {
    coerce(v, p) {
      let n = typeof v === 'number' ? v : parseInt(v, 10);
      if (Number.isNaN(n)) n = p.default ?? 0;
      if (p.min != null) n = Math.max(p.min, n);
      if (p.max != null) n = Math.min(p.max, n);
      return n;
    },
    validate(v, p) {
      if (typeof v !== 'number' || Number.isNaN(v)) return 'Must be a number';
      if (p.min != null && v < p.min) return `Must be \u2265 ${p.min}`;
      if (p.max != null && v > p.max) return `Must be \u2264 ${p.max}`;
      return null;
    }
  },
  float: {
    coerce(v, p) {
      let n = typeof v === 'number' ? v : parseFloat(v);
      if (Number.isNaN(n)) n = p.default ?? 0;
      return n;
    },
    validate(v) {
      return typeof v === 'number' && !Number.isNaN(v) ? null : 'Must be a number';
    }
  },
  string: {
    coerce(v) {
      return v == null ? '' : String(v);
    },
    validate() {
      return null;
    }
  },
  template: {
    coerce(v) {
      return v == null ? '' : String(v);
    },
    validate() {
      return null;
    }
  },
  code: {
    coerce(v) {
      return v == null ? '' : String(v);
    },
    validate() {
      return null;
    }
  },
  bool: {
    coerce(v) {
      return Boolean(v);
    },
    validate() {
      return null;
    }
  },
  enum: {
    coerce(v, p) {
      const values = p.options.map(o => o[0]);
      return values.includes(v) ? v : p.default;
    },
    validate(v, p) {
      return p.options.some(o => o[0] === v) ? null : 'Invalid option';
    }
  },
  regex: {
    coerce(v) {
      return v == null ? '' : String(v);
    },
    validate(v, p) {
      if (!v && !p.required) return null;
      try {
        new RegExp(v);
        return null;
      } catch (e) {
        return 'Invalid regular expression';
      }
    }
  },
  pairs: {
    coerce(v) {
      if (!Array.isArray(v)) return [];
      return v
        .filter((row) => row && typeof row === 'object')
        .map((row) => ({ find: String(row.find ?? ''), replace: String(row.replace ?? '') }));
    },
    validate() {
      return null;
    }
  }
};

export function defaults(paramsSchema) {
  const out = {};
  for (const p of paramsSchema) out[p.key] = p.default;
  return out;
}

export function coerce(paramsSchema, values) {
  const out = {};
  for (const p of paramsSchema) {
    const type = TYPES[p.type];
    const raw = values[p.key] !== undefined ? values[p.key] : p.default;
    out[p.key] = type ? type.coerce(raw, p) : raw;
  }
  return out;
}

export function validate(paramsSchema, values) {
  const errors = {};
  for (const p of visibleParams(paramsSchema, values)) {
    const type = TYPES[p.type];
    if (!type) continue;
    const err = type.validate(values[p.key], p);
    if (err) errors[p.key] = err;
  }
  return errors;
}

export function visibleParams(paramsSchema, values) {
  return paramsSchema.filter(p => !p.show || p.show(values));
}
