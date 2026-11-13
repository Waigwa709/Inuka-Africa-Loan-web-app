import pool from '../src/lib/db';
import fs from 'fs';
import path from 'path';

async function main() {
  const conn = await pool.getConnection();
  const out: string[] = [`-- Inuka Africa DB backup ${new Date().toISOString()}`];
  try {
    const [tables] = await conn.query('SHOW TABLES');
    const names = (tables as any[]).map((t) => Object.values(t)[0] as string);
    for (const t of names) {
      const [create] = await conn.query(`SHOW CREATE TABLE \`${t}\``);
      out.push(`\n-- Table: ${t}`);
      out.push((create as any)[0]['Create Table'] + ';');
      const [rows] = await conn.query(`SELECT * FROM \`${t}\``);
      for (const r of rows as any[]) {
        const cols = Object.keys(r);
        const vals = cols.map((c) => {
          const v = r[c];
          if (v === null) return 'NULL';
          if (v instanceof Date) return `'${v.toISOString().slice(0, 19).replace('T', ' ')}'`;
          return `'${String(v).replace(/'/g, "''")}'`;
        });
        out.push(`INSERT INTO \`${t}\` (${cols.map((c) => `\`${c}\``).join(',')}) VALUES (${vals.join(',')});`);
      }
    }
    const dir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    const file = path.join(dir, `inukaloanapp-backup-${Date.now()}.sql`);
    fs.writeFileSync(file, out.join('\n'));
    console.log('Backup written:', file, `(${out.length} statements)`);
  } finally {
    conn.release();
    await pool.end();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
