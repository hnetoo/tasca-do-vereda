
import postgres from 'postgres';
import 'dotenv/config';

async function queryDatabaseSchema() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('DATABASE_URL not found in .env file');
    process.exit(1);
  }

  const sql = postgres(databaseUrl);

  try {
    console.log('Connecting to database and querying for foreign key constraints...');
    const foreignKeyConstraints = await sql`
      SELECT
        conname AS constraint_name,
        con.relname AS table_name,
        pg_catalog.pg_get_constraintdef(c.oid, true) AS constraint_definition,
        confrel.relname AS foreign_table_name,
        (SELECT array_agg(attname ORDER BY ord)
         FROM pg_attribute JOIN unnest(c.conkey) WITH ORDINALITY AS t(attid, ord) ON attid = attnum
         WHERE attrelid = c.conrelid) AS columns,
        (SELECT array_agg(attname ORDER BY ord)
         FROM pg_attribute JOIN unnest(c.confkey) WITH ORDINALITY AS t(attid, ord) ON attid = attnum
         WHERE attrelid = c.confrelid) AS foreign_columns
      FROM
        pg_constraint c
      JOIN
        pg_class con ON con.oid = c.conrelid
      JOIN
        pg_namespace n ON n.oid = c.connamespace
      JOIN
        pg_class confrel ON confrel.oid = c.confrelid
      WHERE
        n.nspname = 'public' AND c.contype = 'f';
    `;
    console.log('Foreign Key Constraints found:');
    console.table(foreignKeyConstraints);

    console.log('\nQuerying for column definitions...');
    const columnDefinitions = await sql`
      SELECT
        table_name,
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM
        information_schema.columns
      WHERE
        table_schema = 'public'
      ORDER BY
        table_name, ordinal_position;
    `;
    console.log('Column Definitions found:');
    console.table(columnDefinitions);

  } catch (error) {
    console.error('Error querying database schema:', error);
  } finally {
    await sql.end();
  }
}

queryDatabaseSchema();
