import { NextRequest, NextResponse } from 'next/server';
import { whatsappManager } from '@/lib/whatsapp';

export async function GET(request: NextRequest) {
  try {
    const instances = await whatsappManager.getInstances();
    const activeInstances = instances.filter(i => i.status === 'connected').length;
    
    // Aqui você pode implementar a lógica para buscar as estatísticas reais
    const stats = {
      activeInstances,
      todayMessages: 0, // Implementar lógica real
      deliveryRate: 0, // Implementar lógica real
      onlineUsers: 0 // Implementar lógica real
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to get dashboard stats' },
      { status: 500 }
    );
  }
}
