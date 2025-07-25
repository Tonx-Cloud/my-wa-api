"use client";

import DashboardLayout from '@/components/layout/DashboardLayout';

export default function ConfiguracoesPage() {
  return (
    <DashboardLayout>
      <div style={{ color: '#0f0', padding: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 16 }}>Configurações</h1>
        <p>Gerencie configurações gerais da plataforma, tokens, permissões e integrações.</p>
        <div style={{ marginTop: 24, color: '#fff' }}>
          <b>Em breve: </b>Interface para editar configurações do sistema.
        </div>
      </div>
    </DashboardLayout>
  );
}
