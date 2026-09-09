import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const root=resolve(process.cwd()),dist=resolve(root,'dist');
await rm(dist,{recursive:true,force:true});await mkdir(dist,{recursive:true});
await cp(resolve(root,'src'),resolve(dist,'src'),{recursive:true});await cp(resolve(root,'index.html'),resolve(dist,'index.html'));
await writeFile(resolve(dist,'BUILD_INFO.txt'),`Blacksmith Brothers V0.2.1\nBuilt: ${new Date().toISOString()}\nStatic hosting ready.\n`);
console.log('✓ Production build created at dist/');
