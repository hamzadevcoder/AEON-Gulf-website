import { desc, eq } from 'drizzle-orm';
import { requirePermission } from '@/server/auth';
import { requireDb, schema } from '@/server/db';
import { sources, defaultImage, type ImageKey } from '@/content/images';
import { fmtBytes, fmtDate } from '@/lib/format';
import { MAX_BYTES } from '@/server/storage';
import { ActionForm, ConfirmActionForm, ConfirmForm, TextField } from '@/components/admin/Form';
import { deleteMedia, replaceSlot, resetSlot, updateMediaAlt, uploadMedia } from '../../_actions/media';

export const metadata = { title: 'Images' };
export const dynamic = 'force-dynamic';

export default async function MediaAdmin() {
  await requirePermission('media.manage', 'page');
  const db = requireDb();
  const [library, [slotsRow]] = await Promise.all([
    db.select().from(schema.media).orderBy(desc(schema.media.createdAt)).limit(300),
    db.select().from(schema.settings).where(eq(schema.settings.key, 'image_slots')),
  ]);
  const slots = (slotsRow?.value as Record<string, { src: string; alt?: string }>) ?? {};

  return (
    <>
      <div className="adm-head">
        <div>
          <h1>Images</h1>
          <p>Replace any photo on the website, or upload images to use in guides. {`JPG, PNG, WebP, AVIF or GIF, up to ${MAX_BYTES / 1048576} MB.`}</p>
        </div>
      </div>

      <section className="adm-card">
        <h2>Website images</h2>
        <p className="adm-card__hint">Each slot is a photo used on the website. Replacing one updates every page that uses it.</p>
        <div className="adm-media-grid">
          {(Object.keys(sources) as ImageKey[]).map((key) => {
            const current = slots[key];
            const img = current ? { src: current.src, alt: current.alt ?? defaultImage(key).alt } : defaultImage(key);
            return (
              <div className="adm-media" key={key}>
                <div className="adm-media__img">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.src} alt={img.alt} loading="lazy" />
                </div>
                <strong>{defaultImage(key).alt}</strong>
                <span className="adm-muted">{current ? 'Replaced' : 'Original image'}</span>
                <details>
                  <summary>Replace</summary>
                  <ActionForm action={replaceSlot} submitLabel="Use this image">
                    <input type="hidden" name="slot" value={key} />
                    <label className="adm-field">
                      <span>Upload a new image</span>
                      <input type="file" name="file" accept="image/jpeg,image/png,image/webp,image/avif,image/gif" />
                    </label>
                    {library.length > 0 && (
                      <label className="adm-field">
                        <span>or choose from the library</span>
                        <select name="mediaUrl" defaultValue="">
                          <option value="">—</option>
                          {library.map((m) => (
                            <option key={m.id} value={m.url}>
                              {m.filename}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                    <TextField name="alt" label="Description (alt text)" defaultValue={current?.alt ?? ''} help="Describe the photo for screen readers and Google." />
                  </ActionForm>
                  {current && (
                    <ConfirmForm action={resetSlot} confirm="Go back to the original image?" hidden={{ slot: key }}>
                      <button className="adm-btn adm-btn--ghost adm-btn--sm" type="submit">
                        Restore original
                      </button>
                    </ConfirmForm>
                  )}
                </details>
              </div>
            );
          })}
        </div>
      </section>

      <section className="adm-card">
        <h2>Library</h2>
        <ActionForm action={uploadMedia} submitLabel="Upload" resetOnSuccess>
          <label className="adm-field">
            <span>Upload images</span>
            <input type="file" name="files" multiple accept="image/jpeg,image/png,image/webp,image/avif,image/gif" />
          </label>
        </ActionForm>
        <div className="adm-media-grid" style={{ marginTop: 16 }}>
          {library.map((m) => (
            <div className="adm-media" key={m.id}>
              <div className="adm-media__img">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.url} alt={m.alt} loading="lazy" />
              </div>
              <strong style={{ overflowWrap: 'anywhere' }}>{m.filename}</strong>
              <span className="adm-muted">{`${fmtBytes(m.size)} · ${fmtDate(m.createdAt)}`}</span>
              <details>
                <summary>Edit</summary>
                <ActionForm action={updateMediaAlt} submitLabel="Save">
                  <input type="hidden" name="id" value={m.id} />
                  <TextField name="alt" label="Description (alt text)" defaultValue={m.alt} />
                </ActionForm>
                <label className="adm-field">
                  <span>Image address</span>
                  <input readOnly value={m.url} />
                </label>
                <ConfirmActionForm action={deleteMedia} confirm="Delete this image?" label="Delete" hidden={{ id: m.id }} />
              </details>
            </div>
          ))}
        </div>
        {!library.length && <p className="adm-empty">No uploads yet.</p>}
      </section>
    </>
  );
}
