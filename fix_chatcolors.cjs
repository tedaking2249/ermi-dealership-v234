const fs = require('fs');
const f = 'D:/ermi-dealership/src/components/chat/ChatWindow.css';
let s = fs.readFileSync(f, 'utf8');

// max-width 75% + fit-content
s = s.replace(/max-width: 78%;\n  width: fit-content;/, 'max-width: 75%;\n  width: fit-content;');

// outgoing bubble colors
s = s.replace(/\.tg-bubble\.own \{\n  background: #059669;\n  color: #ffffff;\n  border-bottom-right-radius: 4px;\n\}/,
`.tg-bubble.own {
  background: #0F4C81;
  color: #FFFFFF;
  border-bottom-right-radius: 4px;
}`);

// incoming bubble colors
s = s.replace(/\.tg-bubble\.other \{\n  background: #1F2937;\n  color: #F9FAFB;\n  border: 1px solid #374151;\n  border-bottom-left-radius: 4px;\n\}/,
`.tg-bubble.other {
  background: #1E293B;
  color: #FFFFFF;
  border: 1px solid #334155;
  border-bottom-left-radius: 4px;
}`);

// sender name color
s = s.replace(/\.tg-bubble-sender \{\n  display: block;\n  font-size: 0.72rem;\n  font-weight: 600;\n  opacity: 0.75;\n  margin-bottom: 4px;\n\}/,
`.tg-bubble-sender {
  display: block;
  font-size: 0.72rem;
  font-weight: 600;
  color: #38BDF8;
  margin-bottom: 4px;
}`);

// meta base color
s = s.replace(/  opacity: 0.85;\n  margin-top: 4px;\n  color: rgba\(255, 255, 255, 0.85\);\n\}/,
`  opacity: 0.85;
  margin-top: 4px;
  color: #A5F3FC;
}`);

// incoming meta color
s = s.replace(/\.tg-bubble\.other \.tg-bubble-meta \{\n  justify-content: flex-start;\n  color: var\(--color-text-light, #909090\);\n\}/,
`.tg-bubble.other .tg-bubble-meta {
  justify-content: flex-start;
  color: #94A3B8;
}`);

// quick chips
s = s.replace(/\.tg-quick-chip \{\n  flex-shrink: 0;\n  padding: 6px 14px;\n  border-radius: 999px;\n  border: 1px solid var\(--color-border, #303030\);\n  background: var\(--color-background-alt, #1A1A1A\);\n  color: #FFFFFF;/,
`.tg-quick-chip {
  flex-shrink: 0;
  padding: 6px 14px;
  border-radius: 999px;
  border: 1px solid #334155;
  background: #1E293B;
  color: #FFFFFF;`);

// input field
s = s.replace(/\.tg-input-bar input \{\n  flex: 1;\n  padding: 10px 16px;\n  border: 1px solid var\(--color-border, #303030\);\n  border-radius: 999px;\n  background: var\(--color-background-alt, #1A1A1A\);/,
`.tg-input-bar input {
  flex: 1;
  padding: 10px 16px;
  border: 1px solid #334155;
  border-radius: 999px;
  background: #1E293B;
  color: #FFFFFF;`);

fs.writeFileSync(f, s);
console.log('done');
