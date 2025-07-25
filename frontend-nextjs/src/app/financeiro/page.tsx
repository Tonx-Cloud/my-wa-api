"use client";

import DashboardLayout from '@/components/layout/DashboardLayout';

export default function FinanceiroPage() {
  return (
    <DashboardLayout>
      <div style={{ color: '#0f0', padding: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 16 }}>Financeiro</h1>
        <p>Acompanhe cobranças, pagamentos, faturas e histórico financeiro da sua conta.</p>
        <div style={{ marginTop: 24, color: '#fff' }}>
          <b>Em breve: </b>Interface para visualizar e gerenciar dados financeiros.
        </div>
      </div>
    </DashboardLayout>
  );
}
