"use client";

import DashboardLayout from '@/components/layout/DashboardLayout';

export default function DocsPage() {
  return (
    <DashboardLayout>
      <div style={{ color: '#0f0', padding: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 16 }}>Documentação</h1>
        <p>Consulte a documentação da API, exemplos de uso e integrações.</p>
        <div style={{ marginTop: 24, color: '#fff' }}>
          <b>Em breve: </b>Documentação interativa e exemplos de código.
        </div>
      </div>
    </DashboardLayout>
  );
}
