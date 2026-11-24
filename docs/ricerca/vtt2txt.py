import re, sys
# Converte un VTT di sottotitoli automatici YouTube in righe "[mm:ss] testo" senza duplicati.
src, dst = sys.argv[1], sys.argv[2]
lines = open(src, encoding='utf-8').read().splitlines()
out, last, t = [], '', None
for l in lines:
    m = re.match(r'(\d+):(\d\d):(\d\d)\.\d+ -->', l)
    if m:
        h, mi, s = map(int, m.groups()); t = f"{h*60+mi:02d}:{s:02d}"; continue
    if not l.strip() or l.startswith(('WEBVTT','Kind:','Language:')) or t is None: continue
    txt = re.sub(r'<[^>]+>', '', l).strip()
    if txt and txt != last:
        out.append(f"[{t}] {txt}"); last = txt
# accorpa per blocchi di ~30 s
res, cur, ct = [], [], None
for r in out:
    tt, x = r[1:6], r[8:]
    if ct is None: ct = tt
    cur.append(x)
    if int(tt[:2])*60+int(tt[3:]) - (int(ct[:2])*60+int(ct[3:])) >= 30:
        res.append(f"[{ct}] " + ' '.join(cur)); cur, ct = [], None
if cur: res.append(f"[{ct}] " + ' '.join(cur))
open(dst, 'w', encoding='utf-8').write('\n'.join(res))
print(len(res), 'blocchi')
