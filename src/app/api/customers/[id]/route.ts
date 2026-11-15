import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { customers, customerLedgerTransactions, orders } from '@/schema';
import { eq, desc } from 'drizzle-orm';

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
