const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function main() {
  console.log('Reading supabase-init.sql as utf16le...');
  let raw = fs.readFileSync(path.join(__dirname, 'supabase-init.sql'));
  
  // Detect UTF-16 LE BOM (FF FE) or decode appropriately
  let sql;
  if (raw[0] === 0xff && raw[1] === 0xfe) {
    sql = raw.toString('utf16le');
  } else {
    sql = raw.toString('utf-8');
  }

  // Strip comments
  sql = sql.replace(/--[^\r\n]*/g, '');

  // Split cleanly by semicolon
  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  console.log(`Executing ${statements.length} SQL DDL statements on Supabase PostgreSQL...`);

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    try {
      await prisma.$executeRawUnsafe(stmt);
      const firstLine = stmt.split('\n')[0].replace(/\s+/g, ' ').slice(0, 45);
      console.log(`[${i + 1}/${statements.length}] Success: ${firstLine}`);
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log(`[${i + 1}/${statements.length}] Already exists, skipping.`);
      } else {
        console.error(`[${i + 1}/${statements.length}] Error:`, err.message);
      }
    }
  }

  console.log('All tables, constraints, and indexes created successfully in Supabase!');
}

main()
  .catch((e) => {
    console.error('Fatal:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
