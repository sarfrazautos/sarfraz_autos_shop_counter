import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { customers, customerLedgerTransactions, orders } from '@/schema';
import { eq, desc, and, asc } from 'drizzle-orm';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const customer = await db.query.customers.findFirst({
      where: eq(customers.id, id),
    });

    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Recent 5 transactions
    const recentTransactions = await db.query.customerLedgerTransactions.findMany({
      where: eq(customerLedgerTransactions.customerId, id),
      limit: 5,
      orderBy: [desc(customerLedgerTransactions.transactionDate)],
    });

    return NextResponse.json({
      success: true,
      data: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        city: customer.city,
        route: customer.route,
        salesman: customer.salesman,
        customerType: customer.customerType,
        paymentMethod: customer.paymentMethod,
        openingBalance: Number(customer.openingBalance),
        currentBalance: Number(customer.currentBalance),
        creditLimit: Number(customer.creditLimit),
        lastPaymentDate: customer.lastPaymentDate
          ? customer.lastPaymentDate.toISOString().split('T')[0]
          : null,
        recentTransactions: recentTransactions.map((tx) => ({
          id: tx.id,
          voucherNumber: tx.voucherNumber,
          type: tx.transactionType,
          description: tx.description,
          debit: Number(tx.debitAmount),
          credit: Number(tx.creditAmount),
          balance: Number(tx.runningBalance),
          date: tx.transactionDate.toISOString().split('T')[0],
        })),
      },
    });
  } catch (error) {
    console.error('GET /api/customers/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch customer details' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const existing = await db.query.customers.findFirst({
      where: eq(customers.id, id),
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    const {
      name,
      phone,
      city,
      route,
      salesman,
      customerType,
      paymentMethod,
      creditLimit,
      openingBalance,
    } = body;

    const updatePayload: Record<string, any> = {};
    if (name !== undefined) updatePayload.name = name;
    if (phone !== undefined) updatePayload.phone = phone;
    if (city !== undefined) updatePayload.city = city;
    if (route !== undefined) updatePayload.route = route;
    if (salesman !== undefined) updatePayload.salesman = salesman;
    if (customerType !== undefined) updatePayload.customerType = customerType;
    if (paymentMethod !== undefined) updatePayload.paymentMethod = paymentMethod;
    if (creditLimit !== undefined)
      updatePayload.creditLimit = parseFloat(creditLimit).toFixed(2);

    if (openingBalance !== undefined) {
      const newOpeningBal = Math.max(0, parseFloat(openingBalance) || 0);
      const oldOpeningBal = Number(existing.openingBalance) || 0;
      const diff = newOpeningBal - oldOpeningBal;
      const newCurrentBal = Math.max(0, (Number(existing.currentBalance) || 0) + diff);

      updatePayload.openingBalance = newOpeningBal.toFixed(2);
      updatePayload.currentBalance = newCurrentBal.toFixed(2);

      // Check if an Opening Balance transaction exists
      const obTx = await db.query.customerLedgerTransactions.findFirst({
        where: and(
          eq(customerLedgerTransactions.customerId, id),
          eq(customerLedgerTransactions.transactionType, 'Opening Balance')
        ),
      });

      if (obTx) {
        if (newOpeningBal > 0) {
          await db
            .update(customerLedgerTransactions)
            .set({
              debitAmount: newOpeningBal.toFixed(2),
            })
            .where(eq(customerLedgerTransactions.id, obTx.id));
        } else {
          // If new opening balance is 0, delete the OB transaction
          await db
            .delete(customerLedgerTransactions)
            .where(eq(customerLedgerTransactions.id, obTx.id));
        }
      } else if (newOpeningBal > 0) {
        await db.insert(customerLedgerTransactions).values({
          id: `VCH-OB-${id}-${Date.now()}`,
          customerId: id,
          voucherNumber: `OB-${id}-${Math.floor(100 + Math.random() * 900)}`,
          transactionType: 'Opening Balance',
          description: 'Initial opening balance brought forward',
          debitAmount: newOpeningBal.toFixed(2),
          creditAmount: '0.00',
          runningBalance: newOpeningBal.toFixed(2),
          collectorName: existing.salesman || 'Counter Cashier',
          transactionDate: existing.createdAt || new Date(),
        });
      }

      // Recalculate running balances across all transactions for this customer
      const allTx = await db.query.customerLedgerTransactions.findMany({
        where: eq(customerLedgerTransactions.customerId, id),
        orderBy: [asc(customerLedgerTransactions.transactionDate), asc(customerLedgerTransactions.id)],
      });

      let running = 0;
      for (const tx of allTx) {
        running += Number(tx.debitAmount) - Number(tx.creditAmount);
        await db
          .update(customerLedgerTransactions)
          .set({ runningBalance: running.toFixed(2) })
          .where(eq(customerLedgerTransactions.id, tx.id));
      }
    }

    await db.update(customers).set(updatePayload).where(eq(customers.id, id));

    return NextResponse.json({
      success: true,
      message: 'Customer updated successfully',
    });
  } catch (error) {
    console.error('PUT /api/customers/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update customer' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await db.query.customers.findFirst({
      where: eq(customers.id, id),
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    await db.delete(customers).where(eq(customers.id, id));

    return NextResponse.json({
      success: true,
      message: 'Customer deleted successfully',
    });
  } catch (error) {
    console.error('DELETE /api/customers/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete customer' },
      { status: 500 }
    );
  }
}
