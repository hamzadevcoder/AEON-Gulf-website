import type { Field } from '@/content/blocks';
import { SelectField, TextArea, TextField } from './Form';
import { ListEditor } from './ListEditor';

type Option = { value: string; label: string };

/** Renders the right input for each field of a block or section template. */
export function FieldsEditor({ fields, values, imageOptions }: { fields: Field[]; values: Record<string, unknown>; imageOptions: Option[] }) {
  return (
    <>
      {fields.map((f) => {
        const v = values[f.name];
        switch (f.type) {
          case 'list':
            return <ListEditor key={f.name} name={f.name} label={f.label} itemLabel={f.itemLabel} fields={f.fields} min={f.min} max={f.max} initial={(Array.isArray(v) ? v : []) as Record<string, string>[]} />;
          case 'textarea':
            return <TextArea key={f.name} name={f.name} label={f.label} help={f.help} defaultValue={String(v ?? '')} rows={f.name === 'body' ? 8 : 3} />;
          case 'select':
            return <SelectField key={f.name} name={f.name} label={f.label} help={f.help} options={f.options} defaultValue={String(v ?? f.options[0]?.value ?? '')} />;
          case 'image': {
            const cur = String(v ?? '');
            const opts = cur && !imageOptions.some((o) => o.value === cur) ? [...imageOptions, { value: cur, label: cur }] : imageOptions;
            return <SelectField key={f.name} name={f.name} label={f.label} help={f.help ?? 'Upload more photos under Images.'} options={opts} defaultValue={cur} />;
          }
          default:
            return <TextField key={f.name} name={f.name} label={f.label} help={f.help} defaultValue={String(v ?? '')} />;
        }
      })}
    </>
  );
}
