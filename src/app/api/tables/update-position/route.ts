import { NextResponse } from 'next/server';
import { updateTablePosition } from '@/app/actions/tableLayout';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tableId, x, y } = body;

    if (!tableId || typeof x !== 'number' || typeof y !== 'number') {
      return NextResponse.json(
        { error: 'Invalid parameters. Required: tableId (string), x (number), y (number)' },
        { status: 400 }
      );
    }

    const result = await updateTablePosition(tableId, x, y);

    if (result.success) {
      return NextResponse.json({ success: true, message: 'Table position updated successfully' });
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to update table position' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in update-position API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
