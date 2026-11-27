import { redirect } from 'next/navigation';
import { blockDef, builtinSlugForGroup } from '@/content/blocks';

export default async function ContentBlock({ params }: { params: Promise<{ key: string }> }) {
  const key = decodeURIComponent((await params).key);
  const def = blockDef(key);
  if (def?.page === 'Site-wide') redirect('/admin/site?open=footer');
  redirect(def ? `/admin/pages/${builtinSlugForGroup(def.page)}?open=${encodeURIComponent(key)}` : '/admin/pages');
}
