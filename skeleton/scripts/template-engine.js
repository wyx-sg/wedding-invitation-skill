// Tiny template engine: replaces {{a.b.0.c}} with context lookups.
// No conditionals, no loops, no escaping (we trust our own data).

function lookup(obj, path) {
  const parts = path.split('.');
  let cur = obj;
  for (const p of parts) {
    if (cur === undefined || cur === null) return undefined;
    cur = cur[p];
  }
  return cur;
}

export function render(template, context) {
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (match, path) => {
    const value = lookup(context, path);
    return (value === undefined || value === null) ? match : String(value);
  });
}
