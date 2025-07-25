"use client";

import DashboardLayout from '@/components/layout/DashboardLayout';

export default function WebhookPage() {
  return (
    <DashboardLayout>
      <div style={{ color: '#0f0', padding: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 16 }}>Webhooks</h1>
        <p>Configure endpoints para receber eventos do WhatsApp, como mensagens recebidas, status de entrega, etc.</p>
        <div style={{ marginTop: 24, color: '#fff' }}>
          <b>Em breve: </b>Interface para cadastrar, testar e monitorar webhooks.
        </div>
      </div>
    </DashboardLayout>
  );
}
