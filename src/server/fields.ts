import 'server-only';
import { z } from 'zod';
import type { Field } from '@/content/blocks';
import { json, str } from './admin-action';

/** Zod schema for a list of template fields. */
export function fieldsSchema(fields: Field[]) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const f of fields) {
    if (f.type === 'list') {
      const item: Record<string, z.ZodTypeAny> = {};
      for (const sub of f.fields) item[sub.name] = z.string().trim().max(sub.type === 'textarea' ? 4000 : 400);
      shape[f.name] = z.array(z.object(item)).min(f.min ?? 0, `Add at least ${f.min} item(s).`).max(f.max ?? 50);
    } else if (f.type === 'select') {
      shape[f.name] = z.enum(f.options.map((o) => o.value) as [string, ...string[]]);
    } else if (f.type === 'image') {
      shape[f.name] = z.string().trim().max(500);
    } else {
      shape[f.name] = z.string().trim().max(f.type === 'textarea' ? 6000 : 400);
    }
  }
  return z.object(shape);
}

/** Read a submitted form into the raw values for those fields. */
export function readFields(fd: FormData, fields: Field[]) {
  const raw: Record<string, unknown> = {};
  for (const f of fields) raw[f.name] = f.type === 'list' ? json(fd, f.name) : str(fd, f.name);
  return raw;
}
