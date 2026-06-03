import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function PATCH(req: Request) {
    try {
        const user = await requireAuth();
        if (!user) return NextResponse.json({ success: false, error: 'Non authentifie.' }, { status: 401 });

        const body = await req.json();
        const { unreadIds } = body;

        if (!unreadIds || !Array.isArray(unreadIds) || unreadIds.length === 0) {
            return NextResponse.json({ success: false, error: 'No message IDs provided' }, { status: 400 });
        }

        await prisma.message.updateMany({
            where: {
                id: { in: unreadIds },
                receiverId: user.id,
            },
            data: {
                isRead: true
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error marking messages as read:', error);
        return NextResponse.json({ success: false, error: 'Failed to update messages' }, { status: 500 });
    }
}
