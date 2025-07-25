"use client";

import DashboardLayout from '@/components/layout/DashboardLayout';

export default function GptPage() {
  return (
    <DashboardLayout>
      <div style={{ color: '#0f0', padding: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 16 }}>GPT</h1>
        <p>Integre e teste prompts com GPT para automações e respostas inteligentes no WhatsApp.</p>
        <div style={{ marginTop: 24, color: '#fff' }}>
          <b>Em breve: </b>Interface para configurar e testar prompts GPT.
        </div>
      </div>
    </DashboardLayout>
  );
}
