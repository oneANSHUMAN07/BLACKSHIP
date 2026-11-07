import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

const page = await readFile(new URL('./preview.html', import.meta.url));
const server = createServer((request, response) => {
  if (request.url !== '/' && request.url !== '/preview.html') {
    response.writeHead(404).end('Not found');
    return;
  }
  response.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
  response.end(page);
});
server.listen(4173, '127.0.0.1', () => {
  process.stdout.write('BLACKSHIP 3D preview: http://127.0.0.1:4173/\n');
});
