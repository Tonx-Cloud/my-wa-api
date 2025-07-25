"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function GerenciarInstanciaPage() {
  const { id } = useParams();
  const [instance, setInstance] = useState<any>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInstance();
    fetchQr();
  }, [id]);

  const fetchInstance = async () => {
    setLoading(true);
    const res = await fetch(`/api/instances`);
    if (res.ok) {
      const data = await res.json();
      setInstance(data.find((i: any) => i.id === id));
    }
    setLoading(false);
  };

  const fetchQr = async () => {
    const res = await fetch(`/api/instances/${id}/qr`);
    if (res.ok) {
      const data = await res.json();
      setQr(data.qrString || null);
    }
  };

  if (loading || !instance) {
    return <DashboardLayout><div>Carregando...</div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 600, margin: '0 auto', marginTop: 32 }}>
        <h1 style={{ color: '#0f0', fontWeight: 'bold', fontSize: '2em', marginBottom: 8 }}>Gerenciar Instância</h1>
        <div style={{ color: '#fff', marginBottom: 16 }}>ID: {instance.id}</div>
        <div style={{ color: '#fff', marginBottom: 16 }}>Nome: {instance.name}</div>
        <div style={{ color: '#fff', marginBottom: 16 }}>Status: {instance.status}</div>
        {qr && (
          <div style={{ marginBottom: 16 }}>
            <img src={`data:image/png;base64,${qr}`} alt="QR Code" style={{ width: 200, height: 200 }} />
            <div style={{ color: '#fff', marginTop: 8 }}>Escaneie o QR code para conectar.</div>
          </div>
        )}
        <button style={{ color: '#0f0', border: '1px solid #0f0', background: 'none', fontWeight: 'bold', fontFamily: 'inherit', fontSize: '1em', padding: '0.7em 2em', borderRadius: 4, cursor: 'pointer', marginRight: 12 }} onClick={fetchQr}>
          Atualizar QR
        </button>
        <button style={{ color: '#fff', border: '1px solid #0f0', background: '#222', fontWeight: 'bold', fontFamily: 'inherit', fontSize: '1em', padding: '0.7em 2em', borderRadius: 4, cursor: 'pointer' }}>
          Desconectar
        </button>
      </div>
    </DashboardLayout>
  );
}
