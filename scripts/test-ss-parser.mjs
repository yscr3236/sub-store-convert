import fs from 'node:fs';

const raw = fs.readFileSync('/tmp/raw-subscription', 'utf8').trim();
const decoded = Buffer.from(raw, 'base64').toString('utf8').trim();

const lines = decoded
  .split(/\r?\n/)
  .map(x => x.trim())
  .filter(Boolean);

console.log('SS lines:', lines.length);

const ssLines = lines.filter(line => /^ss:\/\//.test(line));

console.log('SS URI lines:', ssLines.length);

console.log('SS URI structure:');

for (const [index, line] of ssLines.entries()) {
  const body = line.slice(5);

  const at = body.lastIndexOf('@');

  if (at === -1) {
    console.log(`#${index + 1}: missing @`);
    continue;
  }

  const userInfo = body.slice(0, at);
  const serverPart = body.slice(at + 1);

  console.log(
    `#${index + 1}: userInfo=${userInfo.length} chars, serverPart=${serverPart.length} chars`
  );
}
