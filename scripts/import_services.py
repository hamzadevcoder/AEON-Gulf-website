"""
Convert the client's "Website Text (Updated)" spreadsheet (CSV export) into
src/content/services.json, applying the corrections listed in CONTENT-FIXES.md.

Usage:  python3 scripts/import_services.py content-source/website-text.csv
Every change made is written to content-source/import-log.md for client review.
"""
import csv, json, re, sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
src = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else ROOT / 'content-source/website-text.csv')
rows = list(csv.reader(open(src, encoding='utf-8')))
header = rows[2]
data = [dict(zip(header, r)) for r in rows[3:] if len(r) > 1 and r[1].strip()]

COUNTRY = {'Kuwait': 'kuwait', 'Qatar': 'qatar', 'Saudi Arabia': 'saudi-arabia'}
log = []

def note(country, service, field, before, after, kind):
    log.append((kind, country, service, field, before, after))

# ---- Corrections applied to every field -------------------------------------------------------
GLOBAL = [
    (r'Ministry of Commerce and Industry and Industry', 'Ministry of Commerce and Industry', 'Duplicated wording'),
    (r'Ministry of Commerceadn Industry', 'Ministry of Commerce and Industry', 'Typo'),
    (r'Commerce adn Industry', 'Commerce and Industry', 'Typo'),
    (r'\bcommer license\b', 'commercial license', 'Typo'),
    (r'\bnormaly\b', 'normally', 'Typo'),
    (r'\bservcies\b', 'services', 'Typo'),
    (r'\barrangment\b', 'arrangement', 'Typo'),
    (r'\bactvtity\b', 'activity', 'Typo'),
    (r'\s*"\s*$', '', 'Stray quotation mark'),
]

# ---- Country-specific corrections (Kuwait copy that was reused for Qatar / Saudi Arabia) ------
QA = [
    (r'submitting tax returns to Qatar Tax Authority', 'submitting tax returns to the General Tax Authority', 'Wrong authority name'),
    (r'Public Authority for Manpower \(PAM\)', 'Ministry of Labour', 'Kuwaiti authority on a Qatar page'),
    (r"Qatar's Public Authority for Manpower", "Qatar's Ministry of Labour", 'Kuwaiti authority on a Qatar page'),
    (r'Qatar Public Authority for Manpower', "Qatar's Ministry of Labour", 'Kuwaiti authority on a Qatar page'),
    (r'with Public Authority for Manpower', 'with the Ministry of Labour', 'Kuwaiti authority on a Qatar page'),
    (r' and Ministry of Social Affairs for efficient', ' for efficient', 'Kuwaiti authority on a Qatar page'),
    (r'Ministry of Social Affairs approvals', 'sector regulator approvals', 'Kuwaiti authority on a Qatar page'),
    (r'Ministry of Social Affairs for certain business activities', 'sector regulators for certain business activities', 'Kuwaiti authority on a Qatar page'),
    (r'Emirates ID or civil ID', 'Qatar ID (QID)', 'UAE document on a Qatar page'),
    (r' \(Article 18 and Article 20\)', '', 'Kuwaiti visa articles on a Qatar page'),
    (r"Established relationships with Qatar's major banks including NBK, Gulf Bank, KFH, and international banks for optimal account placement\.",
     "Established relationships with Qatar's major local and international banks for optimal account placement.", 'Kuwaiti banks on a Qatar page'),
    (r'Leading options include National Bank of Qatar \(NBK\), Gulf Bank, Qatar Finance House \(KFH\), Commercial Bank of Qatar \(CBK\), Ahli United Bank, and international banks like HSBC and Citibank\.',
     'Leading options include Qatar National Bank (QNB), Commercial Bank of Qatar, Doha Bank, Qatar Islamic Bank (QIB) and Dukhan Bank, as well as international banks with a presence in Qatar.', 'Kuwaiti banks on a Qatar page'),
]
SA = [
    (r'submitting tax returns to Saudi Arabia Tax Authority', 'submitting returns to the Zakat, Tax and Customs Authority (ZATCA)', 'Wrong authority name'),
    (r'Ministry of Human Resources and Social Development \(PAM\)', 'Ministry of Human Resources and Social Development (HRSD)', 'Kuwaiti acronym on a Saudi page'),
    (r' and Ministry of Social Affairs for efficient', ' for efficient', 'Kuwaiti authority on a Saudi page'),
    (r'Ministry of Social Affairs approvals', 'sector regulator approvals', 'Kuwaiti authority on a Saudi page'),
    (r'Ministry of Social Affairs for certain business activities', 'sector regulators for certain business activities', 'Kuwaiti authority on a Saudi page'),
    (r'Emirates ID or civil ID', 'Iqama or national ID', 'UAE document on a Saudi page'),
    (r' \(Article 18 and Article 20\)', '', 'Kuwaiti visa articles on a Saudi page'),
    (r"Established relationships with Saudi Arabia's major banks including NBK, Gulf Bank, KFH, and international banks for optimal account placement\.",
     "Established relationships with Saudi Arabia's major local and international banks for optimal account placement.", 'Kuwaiti banks on a Saudi page'),
    (r'Leading options include National Bank of Saudi Arabia \(NBK\), Gulf Bank, Saudi Arabia Finance House \(KFH\), Commercial Bank of Saudi Arabia \(CBK\), Ahli United Bank, and international banks like HSBC and Citibank\.',
     'Leading options include Saudi National Bank (SNB), Al Rajhi Bank, Riyad Bank, Saudi Awwal Bank (SAB) and Banque Saudi Fransi, as well as international banks with a presence in the Kingdom.', 'Kuwaiti banks on a Saudi page'),
]
PER_COUNTRY = {'Qatar': QA, 'Saudi Arabia': SA, 'Kuwait': []}

def clean(text, country, service, field):
    t = re.sub(r'\s+', ' ', text.replace('\u00a0', ' ')).strip()
    for pat, rep, kind in GLOBAL + PER_COUNTRY[country]:
        new = re.sub(pat, rep, t)
        if new != t:
            note(country, service, field, t, new, kind)
            t = new
    return t

TRUNCATED = re.compile(r'\b(of|and|for|the|with|seamless|official|building|curriculum|Commerce|Social|Manpower)\.$')

def fix_meta(desc, country, service):
    if not TRUNCATED.search(desc) and len(desc) <= 165:
        return desc
    sentences = re.split(r'(?<=\.)\s+', desc)
    keep = None
    if TRUNCATED.search(desc):
        # Trim only the dangling final clause ("…, and building." / "… with Kuwait Ministry of.").
        for pat in (r'\s+with\s+[^,.]*\.$', r',?\s+and\s+\w+\.$', r'\s+for\s+\w+\.$', r'\s+\w+\.$'):
            trimmed = re.sub(pat, '.', desc)
            if trimmed != desc and not TRUNCATED.search(trimmed) and len(trimmed) <= 165:
                keep = trimmed
                break
    if keep is None:
        keep = ' '.join(sentences[:-1]) if TRUNCATED.search(desc) else sentences[0]
    keep = re.sub(r',\s*\.$', '.', keep)
    if len(keep) < 115:
        keep += ' Get a tailored quote from AEON Gulf.'
    note(country, service, 'Meta_Description', desc, keep, 'Meta description cut off mid-sentence')
    return keep

def fix_title(title, country, service):
    """Google shows about 60 characters of a title: drop the brand suffix, then 'Services', if it is longer."""
    t = title
    for trim in (lambda x: re.sub(r'\s*\|\s*AEON Gulf$', '', x), lambda x: x.replace(' Services', '', 1)):
        if len(t) <= 60:
            break
        t = trim(t)
    if t != title:
        note(country, service, 'Meta_Title', title, t, 'Meta title over 60 characters')
    return t

GROUPS = {
    'Corporate Services': 'corporate',
    'PRO Services': 'pro', 'GRO Services': 'pro',
    'Finance and Accounting Services': 'finance', 'Finance and Accounting': 'finance',
    'Relocation Services': 'relocation',
}

services = []
for r in data:
    country = r['Country'].strip()
    raw_name = r['Service_Name'].strip()
    f = {k: clean(v, country, raw_name, k) for k, v in r.items() if k}
    slug = f['URL_Slug'].strip('/').replace('-saudi-arabia', '')
    name = re.sub(r' in Saudi Arabia$', '', f['Service_Listing_Heading'])
    group = GROUPS[f['Service_Group']]

    primary, secondary, longtail = f['Primary_Keyword'], f['Secondary_Keywords'], f['Long_tail_Keywords']
    if 'restructuring' in primary and 'restructuring' not in raw_name.lower():
        c = country
        new = (f'commercial license {c}', f'commercial license renewal {c}, trade license {c}, business license {c}',
               f'commercial license issuance and renewal {c}, {c} Ministry of Commerce license')
        note(country, raw_name, 'Keywords', primary, new[0], 'SEO keywords copied from Corporate Restructuring')
        primary, secondary, longtail = new

    cta_heading, cta_desc, cta_text = f['CTA_Heading'], f['CTA_Description'], f['CTA_Text']
    if len(cta_text) > 45 and cta_desc.endswith('?'):
        # Row shifted by one column: an extra paragraph sits in CTA_Heading, the heading in CTA_Description
        # and the description in CTA_Text. Move each back; the stray paragraph fills FAQ 6 if that is empty.
        if not f['FAQ6_Answer']:
            f['FAQ6_Answer'] = cta_heading
        fixed = f'Get Your {name.replace(" Services", "")} Quote'
        note(country, raw_name, 'FAQ6_Answer / CTA', f'CTA_Heading="{cta_heading[:60]}…", CTA_Description="{cta_desc}", CTA_Text="{cta_text[:60]}…"',
             f'stray paragraph removed, CTA_Heading="{cta_desc}", CTA_Description=old CTA_Text, CTA_Text="{fixed}"', 'Columns shifted in this row')
        cta_heading, cta_desc, cta_text = cta_desc, cta_text, fixed
    elif len(cta_text) > 45:
        fixed = f'Get Your {name.replace(" Services", "")} Quote'
        note(country, raw_name, 'CTA_Text', cta_text, fixed, 'Button label was a full sentence')
        cta_text = fixed

    steps_heading = f['Steps_Heading'] or f'Our 4-Step {country} {name} Process'
    if not f['Steps_Heading']:
        note(country, raw_name, 'Steps_Heading', '', steps_heading, 'Missing heading filled in')

    services.append({
        'country': COUNTRY[country],
        'countryName': country,
        'group': group,
        'groupLabel': 'GRO Services' if group == 'pro' and country == 'Saudi Arabia' else
                      {'corporate': 'Corporate Services', 'pro': 'PRO Services', 'finance': 'Finance and Accounting', 'relocation': 'Relocation Services'}[group],
        'slug': slug,
        'name': name,
        'metaTitle': fix_title(f['Meta_Title'], country, raw_name),
        'metaDescription': fix_meta(f['Meta_Description'], country, raw_name),
        'keywords': [k.strip() for k in ', '.join([primary, secondary, longtail]).split(',') if k.strip()],
        'listing': {'heading': name, 'body': f['Service_Listing_Body']},
        'hero': {'heading': f['Hero_Heading'], 'subtitle': f['Hero_Subtitle']},
        'why': {'heading': f['Why_Choose_Heading'], 'description': f['Why_Choose_Description']},
        'benefits': [{'title': f[f'Benefit{i}_Title'], 'text': f[f'Benefit{i}_Description']} for i in (1, 2, 3)],
        'steps': {'heading': steps_heading, 'items': [{'title': f[f'Step{i}_Title'], 'text': f[f'Step{i}_Description']} for i in (1, 2, 3, 4)]},
        'faqs': [{'q': f[f'FAQ{i}_Question'], 'a': f[f'FAQ{i}_Answer']} for i in range(1, 7) if f[f'FAQ{i}_Question']],
        'cta': {'heading': cta_heading, 'description': cta_desc, 'text': cta_text},
    })

out = ROOT / 'src/content/services.json'
json.dump(services, open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

kinds = {}
for k, *_ in log:
    kinds[k] = kinds.get(k, 0) + 1
with open(ROOT / 'content-source/import-log.md', 'w', encoding='utf-8') as fh:
    fh.write('# Content import log\n\nEvery automatic change made while importing the spreadsheet. Please review, especially the factual corrections.\n\n')
    fh.write('| Change type | Count |\n|---|---|\n' + ''.join(f'| {k} | {v} |\n' for k, v in sorted(kinds.items(), key=lambda x: -x[1])) + '\n')
    for kind, country, service, field, before, after in log:
        fh.write(f'### {country}: {service} ({field})\n*{kind}*\n\n- Before: {before}\n- After: {after}\n\n')
print(f'{len(services)} services written to {out.relative_to(ROOT)}; {len(log)} changes logged')
for k, v in sorted(kinds.items(), key=lambda x: -x[1]):
    print(f'  {v:3d}  {k}')
