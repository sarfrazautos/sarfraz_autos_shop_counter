const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env' });
const sql = neon(process.env.DATABASE_URL);

async function run() {
  const rows = await sql`
    SELECT s.id, s.title, s.buy_quantity, s.free_quantity, s.net_scheme_rate, p.wholesale_price, p.retail_price
    FROM trade_schemes s
    JOIN products p ON s.product_id = p.id
    WHERE s.net_scheme_rate IS NOT NULL
    LIMIT 20
  `;
  for (const r of rows) {
    const buy = Number(r.buy_quantity);
    const free = Number(r.free_quantity);
    const formulaWs = Math.round(Number(r.wholesale_price) * buy / (buy + free));
    const formulaRt = Math.round(Number(r.retail_price) * buy / (buy + free));
    console.log(`${r.title.slice(0, 45)}: dbNet=${r.net_scheme_rate}, wsFormula=${formulaWs}, rtFormula=${formulaRt}`);
  }
  process.exit(0);
}
run();
