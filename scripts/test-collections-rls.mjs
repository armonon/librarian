import {execFileSync} from 'node:child_process';
import {mkdtempSync,rmSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {createServer} from 'node:net';
const bin=process.env.PGBIN || (existsSync('/opt/homebrew/opt/postgresql@16/bin/initdb')?'/opt/homebrew/opt/postgresql@16/bin':'');
const command=name=>bin?join(bin,name):name;
const root=mkdtempSync(join(tmpdir(),'librarian-rls-')),data=join(root,'data');let started=false;
const socket=createServer();await new Promise(resolve=>socket.listen(0,'127.0.0.1',resolve));const port=socket.address().port;await new Promise(resolve=>socket.close(resolve));
try {
 execFileSync(command('initdb'),['-D',data,'-A','trust','--no-locale'],{stdio:'pipe'});
 execFileSync(command('pg_ctl'),['-D',data,'-l',join(root,'server.log'),'-o',`-p ${port} -h 127.0.0.1`,'start'],{stdio:'pipe'});started=true;
 execFileSync(command('psql'),['-h','127.0.0.1','-p',String(port),'-d','postgres','-v','ON_ERROR_STOP=1','-f',resolve('tests/support/collections-db-setup.sql'),'-f',resolve('supabase/migrations/202610100001_librarian_collections.sql'),'-f',resolve('tests/collections-rls.sql')],{stdio:'pipe'});
 console.log('Collections SQL migration and role/access tests passed in an isolated PostgreSQL cluster.');
} finally {
 if(started)execFileSync(command('pg_ctl'),['-D',data,'stop','-m','fast'],{stdio:'pipe'});
 rmSync(root,{recursive:true,force:true});
}
