const fs = require('fs');
const f = 'D:/ermi-dealership/src/components/layout/AdminNavbar.css';
let s = fs.readFileSync(f, 'utf8');

// Add base .btn-login style before media query
const base = `.btn-login {
  padding: 8px 16px;
  border-radius: 999px;
  background-color: var(--color-primary);
  color: #fff;
  font-size: var(--font-size-sm);
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: background-color var(--transition);
}

.btn-login:hover {
  background-color: var(--color-primary-dark);
}

`;
s = s.replace('@media (max-width: 760px) {', base + '@media (max-width: 760px) {');

// Remove mobile-only override block
s = s.replace(`.admin-navbar-actions-mobile .btn-login {
    width: 100%;
    text-align: center;
  }
`, '');

fs.writeFileSync(f, s);
console.log('done');
