const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env' });
const sql = neon(process.env.DATABASE_URL);

async function run() {
  const result = await sql`
    UPDATE trade_schemes
    SET net_scheme_rate = NULL
    WHERE net_scheme_rate IS NOT NULL
  `;
  console.log('Cleared static net_scheme_rate values:', result);
  process.exit(0);
}
run();
