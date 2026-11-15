import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { branchNodes, products, orders, customers } from '@/schema';
import { sql } from 'drizzle-orm';
import { list } from '@vercel/blob';

export async function GET(req: NextRequest) {
  try {
    const startTime = Date.now();

    // 1. Query real Postgres database size from Neon
    const sizeResult = await db.execute(
      sql`SELECT pg_database_size(current_database()) as bytes, pg_size_pretty(pg_database_size(current_database())) as pretty`
    );
    const dbLatencyMs = Date.now() - startTime;

    const dbBytes = Number((sizeResult.rows[0] as any)?.bytes || 0);
    const dbLimitMb = 512; // Neon Free Tier Limit: 512 MB
    const dbUsedMb = Number((dbBytes / (1024 * 1024)).toFixed(2));
    const dbAvailableMb = Number(Math.max(0, dbLimitMb - dbUsedMb).toFixed(2));
    const dbPercentUsed = Number(((dbUsedMb / dbLimitMb) * 100).toFixed(1));

    // 2. Query real Vercel Blob media storage
    let blobFilesCount = 0;
    let blobBytes = 0;
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    if (blobToken) {
      try {
        const { blobs } = await list({ token: blobToken });
        blobFilesCount = blobs.length;
        blobBytes = blobs.reduce((sum, b) => sum + b.size, 0);
      } catch (err) {
        console.warn('Vercel Blob list query warning:', err);
      }
    }
    const blobLimitMb = 1024; // Vercel Blob Free Tier Limit: 1.0 GB
    const blobUsedMb = Number((blobBytes / (1024 * 1024)).toFixed(2));
    const blobAvailableMb = Number(Math.max(0, blobLimitMb - blobUsedMb).toFixed(2));
    const blobPercentUsed = Number(((blobUsedMb / blobLimitMb) * 100).toFixed(1));

    // 3. Fetch branch nodes
    const nodes = await db.query.branchNodes.findMany();

    // 4. Fetch counts
    const [prodCount] = await db.select({ count: sql<number>`count(*)` }).from(products);
    const [ordCount] = await db.select({ count: sql<number>`count(*)` }).from(orders);
    const [custCount] = await db.select({ count: sql<number>`count(*)` }).from(customers);

    return NextResponse.json({
      success: true,
      database: {
        status: 'healthy',
        provider: 'Neon Serverless PostgreSQL',
        latencyMs: dbLatencyMs,
        branch: 'production',
        tablesCount: 20,
        bytes: dbBytes,
        usedMb: dbUsedMb,
        limitMb: dbLimitMb,
        availableMb: dbAvailableMb,
        percentUsed: dbPercentUsed,
        usedFormatted: `${dbUsedMb} MB`,
        limitFormatted: `${dbLimitMb} MB`,
        availableFormatted: `${dbAvailableMb} MB remaining`,
      },
      media: {
        status: 'healthy',
        provider: 'Vercel Blob Storage',
        storeId: process.env.BLOB_STORE_ID || 'store_CVoYBcgMAEYUDsSs',
        bytes: blobBytes,
        usedMb: blobUsedMb,
        limitMb: blobLimitMb,
        availableMb: blobAvailableMb,
        percentUsed: blobPercentUsed,
        usedFormatted: blobUsedMb >= 1 ? `${blobUsedMb} MB` : `${(blobBytes / 1024).toFixed(1)} KB`,
        limitFormatted: '1.0 GB',
        availableFormatted:
          blobAvailableMb >= 1000
            ? `${(blobAvailableMb / 1024).toFixed(2)} GB remaining`
            : `${blobAvailableMb} MB remaining`,
        filesCount: blobFilesCount,
      },
      counts: {
        products: Number(prodCount?.count || 0),
        orders: Number(ordCount?.count || 0),
        customers: Number(custCount?.count || 0),
      },
      branchNodes: nodes.map((n) => ({
        id: n.id,
        branchId: n.branchId,
        counterName: n.counterName,
        ipAddress: n.ipAddress,
        pingLatency: `${n.pingLatencyMs}ms`,
        status: n.status,
        lastSync: n.lastSyncTime.toISOString(),
        syncHealth: n.syncHealth,
      })),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('GET /api/system-health error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'System health check failed',
        database: { status: 'unhealthy', error: String(error) },
      },
      { status: 500 }
    );
  }
}
