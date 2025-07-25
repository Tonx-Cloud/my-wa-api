"use client";

import DashboardLayout from '@/components/layout/DashboardLayout';

export default function SdkPage() {
  return (
    <DashboardLayout>
      <div style={{ color: '#0f0', padding: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 16 }}>SDK</h1>
        <p>Baixe SDKs, exemplos e ferramentas para integração com a API WhatsApp.</p>
        <div style={{ marginTop: 24, color: '#fff' }}>
          <b>Em breve: </b>Downloads e exemplos de SDK para várias linguagens.
        </div>
      </div>
    </DashboardLayout>
  );
}
