import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { bankAccounts } from '@/schema';
import { eq, desc, and } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const conditions = [];
    if (activeOnly) {
      conditions.push(eq(bankAccounts.isActive, true));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const accounts = await db.query.bankAccounts.findMany({
      where: whereClause,
      orderBy: [desc(bankAccounts.isActive), desc(bankAccounts.createdAt)],
    });

    return NextResponse.json({
      success: true,
      data: accounts,
    });
  } catch (error) {
    console.error('GET /api/bank-accounts error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch bank accounts' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      bankName,
      accountTitle,
      accountNumber,
      branchName = '',
      iban = '',
      isActive = true,
      notes = '',
    } = body;

    if (!bankName || !accountTitle || !accountNumber) {
      return NextResponse.json(
        { success: false, error: 'Bank Name, Account Title, and Account Number are required' },
        { status: 400 }
      );
    }

    const id = `BANK-${Date.now().toString().slice(-6)}`;

    const newAccount = {
      id,
      bankName: bankName.trim(),
      accountTitle: accountTitle.trim(),
      accountNumber: accountNumber.trim(),
      branchName: (branchName || '').trim(),
      iban: (iban || '').trim(),
      isActive: Boolean(isActive),
      notes: (notes || '').trim(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(bankAccounts).values(newAccount);

    return NextResponse.json({
      success: true,
      data: newAccount,
      message: 'Bank account added successfully',
    });
  } catch (error) {
    console.error('POST /api/bank-accounts error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create bank account' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      bankName,
      accountTitle,
      accountNumber,
      branchName,
      iban,
      isActive,
      notes,
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Account ID is required' },
        { status: 400 }
      );
    }

    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (bankName !== undefined) updateData.bankName = bankName.trim();
    if (accountTitle !== undefined) updateData.accountTitle = accountTitle.trim();
    if (accountNumber !== undefined) updateData.accountNumber = accountNumber.trim();
    if (branchName !== undefined) updateData.branchName = branchName.trim();
    if (iban !== undefined) updateData.iban = iban.trim();
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);
    if (notes !== undefined) updateData.notes = notes.trim();

    await db
      .update(bankAccounts)
      .set(updateData)
      .where(eq(bankAccounts.id, id));

    return NextResponse.json({
      success: true,
      message: 'Bank account updated successfully',
    });
  } catch (error) {
    console.error('PUT /api/bank-accounts error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update bank account' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Account ID is required' },
        { status: 400 }
      );
    }

    await db.delete(bankAccounts).where(eq(bankAccounts.id, id));

    return NextResponse.json({
      success: true,
      message: 'Bank account deleted successfully',
    });
  } catch (error) {
    console.error('DELETE /api/bank-accounts error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete bank account' },
      { status: 500 }
    );
  }
}
