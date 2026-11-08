import fs from 'fs';
import path from 'path';

const root = process.cwd();
const bak = path.join('C:\\ermi-backups', 'labels-' + Date.now());
fs.mkdirSync(bak, { recursive: true });

const files = {
  'src/pages/VehicleDetails.jsx': [
    [/(\n[ \t]*)Reserve Vehicle(\n)/, "$1{t('reserve.vehicle')}$2", "t('reserve.vehicle')"],
    [/(\n[ \t]*)Book Test Drive(\n)/, "$1{t('book.test.drive')}$2", "t('book.test.drive')"],
    [/: 'Chat with Dealer'\}/, ": t('chat.with.dealer')}", "t('chat.with.dealer')"],
  ],
  'src/components/layout/Navbar.jsx': [
    [/>Google my car<\/NavLink>/, ">{t('google.mycar')}</NavLink>", "t('google.mycar')"],
    [/role="menuitem">My Submissions<\/Link>/, "role=\"menuitem\">{t('my.submissions')}</Link>", "t('my.submissions')"],
  ],
  'src/components/layout/BottomNav.jsx': [
    [/const \{ lang \} = useLanguage\(\);/, "const { lang, t } = useLanguage();", "const { lang, t } = useLanguage();"],
    [/<IoSearchOutline \/> Google my car<\/Link>/, "<IoSearchOutline /> {t('google.mycar')}</Link>", "t('google.mycar')"],
    [/\{lang === 'am' \? '[^']*' : 'My Submissions'\}/, "{t('my.submissions')}", "t('my.submissions')"],
  ],
  'src/pages/GoogleMyCar.jsx': [
    [/(import \{ useState \} from 'react';\n)/, "$1import { useLanguage } from '../context/LanguageContext';\n", "useLanguage"],
    [/(function GoogleMyCar\(\) \{\n)/, "$1  const { t } = useLanguage();\n", "const { t } = useLanguage();"],
    [/<h1>Google my car<\/h1>/, "<h1>{t('google.mycar')}</h1>", "t('google.mycar')"],
  ],
};

const plan = [];
let bad = false;
for (const [rel, edits] of Object.entries(files)) {
  const p = path.join(root, rel);
  if (!fs.existsSync(p)) { console.error('STOP: missing ' + rel); bad = true; continue; }
  const raw = fs.readFileSync(p, 'utf8');
  const crlf = raw.includes('\r\n');
  let s = raw.replace(/\r\n/g, '\n');
  let changed = false;
  for (const [re, to, done] of edits) {
    if (s.includes(done)) continue;
    const n = (s.match(new RegExp(re.source, 'g')) || []).length;
    if (n === 1) { s = s.replace(re, to); changed = true; }
    else { console.error(`STOP: ${rel}: pattern found ${n}x: ${re.source.slice(0, 60)}`); bad = true; }
  }
  plan.push({ rel, p, s, crlf, changed });
}
if (bad) { console.error('Nothing was changed.'); process.exit(1); }

for (const f of plan) {
  if (!f.changed) { console.log('already done: ' + f.rel); continue; }
  fs.copyFileSync(f.p, path.join(bak, f.rel.replace(/[\\/]/g, '__')));
  fs.writeFileSync(f.p, f.crlf ? f.s.replace(/\n/g, '\r\n') : f.s, 'utf8');
  console.log('patched: ' + f.rel);
}
console.log('Done. Backups in ' + bak);