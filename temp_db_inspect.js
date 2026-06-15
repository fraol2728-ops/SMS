const fs = require('fs');
const { Client } = require('pg');

const env = fs.readFileSync('.env.local', 'utf8')
  .split(/\r?\n/)
  .filter(Boolean)
  .reduce((acc, line) => {
    const m = line.match(/^([^=]+)=(.*)$/);
    if (m) acc[m[1]] = m[2];
    return acc;
  }, {});

const url = env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL missing');
  process.exit(1);
}

(async () => {
  const client = new Client({ connectionString: url });
  await client.connect();
  console.log('CONNECTED');

  const tables = await client.query(
    "select schemaname, tablename from pg_catalog.pg_tables where schemaname='public' order by tablename",
  );
  console.log('TABLES:' + tables.rows.map((r) => r.tablename).join(', '));

  const adminRes = await client.query(
    "SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_schema='public' AND table_name IN ('adminsettings','admin_settings') ORDER BY ordinal_position",
  );
  console.log('ADMIN_COLUMNS_COUNT:' + adminRes.rowCount);
  adminRes.rows.forEach((r) => console.log(JSON.stringify(r)));

  const userRes = await client.query(
    "SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_schema='public' AND table_name IN ('user','users') ORDER BY ordinal_position",
  );
  console.log('USER_COLUMNS_COUNT:' + userRes.rowCount);
  userRes.rows.forEach((r) => console.log(JSON.stringify(r)));

  const userIndex = await client.query(
    "SELECT indexname, indexdef FROM pg_indexes WHERE schemaname='public' AND tablename IN ('user','users') ORDER BY indexname",
  );
  console.log('USER_INDEXES_COUNT:' + userIndex.rowCount);
  userIndex.rows.forEach((r) => console.log(JSON.stringify(r)));

  await client.end();
})().catch((err) => {
  console.error('ERROR', err);
  process.exit(1);
});
