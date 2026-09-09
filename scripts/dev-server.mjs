import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
const root = process.cwd();
const port = Number(process.env.PORT || 5173);
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json'};
const server = http.createServer(async (req,res)=>{
  try {
    let p = decodeURIComponent((req.url || '/').split('?')[0]);
    if (p === '/') p = '/index.html';
    p = normalize(p).replace(/^([.][.][/\\])+/, '');
    const file = join(root, p);
    const s = await stat(file);
    const target = s.isDirectory() ? join(file,'index.html') : file;
    const data = await readFile(target);
    res.writeHead(200, {'Content-Type':mime[extname(target)] || 'application/octet-stream','Cache-Control':'no-store'}); res.end(data);
  } catch { res.writeHead(404); res.end('Not found'); }
});
server.listen(port, ()=>console.log(`Blacksmith Brothers dev server: http://localhost:${port}`));
