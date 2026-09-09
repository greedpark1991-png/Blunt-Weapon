import { cp, mkdir, rm, writeFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';
const root=resolve(process.cwd()),dist=resolve(root,'dist');
await rm(dist,{recursive:true,force:true});await mkdir(dist,{recursive:true});
await cp(resolve(root,'src'),resolve(dist,'src'),{recursive:true});
await cp(resolve(root,'index.html'),resolve(dist,'index.html'));
try{await access(resolve(root,'assets'));await cp(resolve(root,'assets'),resolve(dist,'assets'),{recursive:true});}catch{}
await writeFile(resolve(dist,'BUILD_INFO.txt'),`Blacksmith Brothers V0.2.5b\nBuilt: ${new Date().toISOString()}\nStatic hosting ready.\nIncludes supplied The Artisan's Hearth BGM.\n`);
console.log('✓ Production build created at dist/');
