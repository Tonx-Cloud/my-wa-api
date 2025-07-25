"use client";

import { useState, useEffect } from "react";
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { api, syncSessionWithBackend } from '@/utils/api';
import { CheckCircle, XCircle, Clock } from "lucide-react";
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Instance, QrCodeResponse, ErrorResponse } from '@/types/api';


interface QrState {
  [id: string]: string | null;
}



export default function ConexaoPage() {
  const { data: session } = useSession();
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(true); // loading global só na primeira carga
  const [qrCodes, setQrCodes] = useState<QrState>({});
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Sincronizar sessão com backend antes de buscar dados
    const initializeData = async () => {
      if (session) {
        console.log('Session found, syncing with backend...');
        await syncSessionWithBackend();
      }
      fetchInstances();
    };
    
    initializeData();
  }, [session]);

  // Polling para QR code enquanto houver instância "connecting"
  useEffect(() => {
    const connectingIds = instances.filter(i => i.status === "connecting").map(i => i.id);
    if (connectingIds.length === 0) return;
    const interval = setInterval(() => {
      connectingIds.forEach(id => fetchQr(id));
      fetchInstances();
    }, 3000); // a cada 3 segundos
    return () => clearInterval(interval);
  }, [instances]);

  const fetchInstances = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await api.get('/api/instances');
      console.log('fetchInstances response:', res);
      if (res.status === 200) {
        try {
          const data = res.data;
          console.log('fetchInstances data:', data);
          setInstances(data);
          // Buscar QR codes para instâncias "connecting"
          for (const inst of data) {
            if (inst.status === "connecting") {
              fetchQr(inst.id);
            } else {
              setQrCodes(qr => ({ ...qr, [inst.id]: null }));
            }
          }
        } catch (jsonErr) {
          setErrorMsg('Erro ao processar resposta da API.');
        }
      } else {
        setErrorMsg('Erro ao buscar instâncias: ' + res.status);
      }
    } catch (error: any) {
      setErrorMsg('Erro de rede ou servidor: ' + (error?.message || error));
    } finally {
      setLoading(false);
    }
  };

  const fetchQr = async (id: string) => {
    try {
      const res = await api.get(`/api/instances/${id}/qr`);
      console.log('fetchQr response:', res);
      if (res.status === 200) {
        const data = res.data;
        console.log('fetchQr data:', data);
        setQrCodes(qr => ({ ...qr, [id]: data.qrString }));
      } else {
        setQrCodes(qr => ({ ...qr, [id]: null }));
      }
    } catch (err) {
      console.log('fetchQr error:', err);
      setQrCodes(qr => ({ ...qr, [id]: null }));
    }
  };
  const handleConnect = async (id: string) => {
    await fetchQr(id); // Tenta buscar QR code
    fetchInstances();
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    setErrorMsg(null);
    try {
      const res = await api.post('/api/instances', { name: newName });
      console.log('handleCreate response:', res);
      if (res.status === 200 || res.status === 201) {
        try {
          const data = res.data;
          console.log('handleCreate data:', data);
          setNewName("");
          setInstances(prev => [{ id: data.id, name: data.name, status: data.status }, ...prev]);
          if (data.status === "connecting") fetchQr(data.id);
        } catch (jsonErr) {
          setErrorMsg('Erro ao processar resposta da API.');
        }
      } else {
        let msg = 'Erro ao criar instância: ' + res.status;
        try {
          const errData = res.data;
          console.log('handleCreate error data:', errData);
          if (errData?.error) msg += ' - ' + errData.error;
        } catch {}
        setErrorMsg(msg);
      }
    } catch (error: any) {
      setErrorMsg('Erro de rede ou servidor: ' + (error?.message || error));
    } finally {
      setCreating(false);
    }
  };

  // Funções de ação
  const handleRestart = async (id: string) => {
    if (!confirm('Deseja reiniciar esta instância?')) return;
    await api.post(`/api/instances/${id}/restart`);
    fetchInstances();
  };

  const handleDisconnect = async (id: string) => {
    if (!confirm('Deseja desconectar esta instância?')) return;
    await api.post(`/api/instances/${id}/disconnect`);
    fetchInstances();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja deletar esta instância?')) return;
    await api.delete(`/api/instances/${id}`);
    fetchInstances();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
        return <CheckCircle style={{ color: "#0f0", width: 20, height: 20 }} />;
      case "disconnected":
        return <XCircle style={{ color: "#f00", width: 20, height: 20 }} />;
      case "connecting":
        return <Clock style={{ color: "#ff0", width: 20, height: 20 }} />;
      default:
        return <XCircle style={{ color: "#888", width: 20, height: 20 }} />;
    }
  };

  if (!isClient || loading) {
    return (
      <div style={{ minHeight: "40vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#0f0" }}>
        Carregando...
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 900, margin: "0 auto", marginTop: 32, display: 'flex', flexDirection: 'column', gap: 32 }}>
        <h1 style={{ color: "#0f0", fontWeight: "bold", fontSize: "2em", marginBottom: 8, textAlign: 'center' }}>Gerenciar Conexões WhatsApp</h1>

        {errorMsg && (
          <div style={{ background: '#300', color: '#fff', border: '2px solid #f00', borderRadius: 8, padding: 16, textAlign: 'center', fontWeight: 'bold', marginBottom: 16 }}>
            {errorMsg}
          </div>
        )}

        {/* Área de destaque para criar nova instância */}
        <div style={{ background: '#111', border: '2px solid #0f0', borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, boxShadow: '0 0 16px #0f04' }}>
          <div style={{ fontWeight: 'bold', color: '#0f0', fontSize: 18 }}>Nova Instância</div>
          <div style={{ display: 'flex', gap: 12, width: '100%', maxWidth: 400 }}>
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Nome da nova instância"
              style={{ flex: 1, padding: 10, borderRadius: 6, border: '1px solid #0f0', background: '#181818', color: '#0f0', fontFamily: 'inherit', fontSize: 16 }}
            />
            <button onClick={handleCreate} disabled={creating || !newName.trim()} style={{ color: '#111', background: '#0f0', border: 'none', fontWeight: 'bold', fontFamily: 'inherit', fontSize: '1em', padding: '0.5em 1.5em', borderRadius: 6, cursor: 'pointer', boxShadow: '0 0 8px #0f04' }}>
              {creating ? 'Criando...' : 'Criar'}
            </button>
          </div>
        </div>

        {/* QR code em destaque da instância recém-criada ou aguardando conexão */}
        {instances.length > 0 && instances[0].status === 'connecting' && qrCodes[instances[0].id] && (
          <div style={{ background: '#181818', border: '2px solid #0f0', borderRadius: 12, padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, boxShadow: '0 0 16px #0f04' }}>
            <div style={{ color: '#0f0', fontWeight: 'bold', fontSize: 20, marginBottom: 8 }}>Conecte seu WhatsApp</div>
            <div style={{ color: '#fff', fontSize: 15, marginBottom: 8 }}>Abra o WhatsApp no seu celular {'>'} Menu {'>'} Dispositivos conectados {'>'} Conectar um dispositivo {'>'} Escaneie o QR code abaixo:</div>
            <div style={{ background: '#fff', padding: 12, borderRadius: 12, display: 'inline-block', marginTop: 4, boxShadow: '0 0 8px #0f0a' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrCodes[instances[0].id] || ''} alt="QR Code" style={{ width: 220, height: 220 }} />
            </div>
            <div style={{ color: '#0f0', fontSize: 14, marginTop: 8 }}>Aguarde a leitura do QR code para conectar.</div>
          </div>
        )}

        {/* Lista de instâncias/conexões */}
        <div style={{ border: "1px solid #0f0", borderRadius: 8, background: "#111", padding: 24, boxShadow: '0 0 8px #0f04' }}>
          <div style={{ color: '#0f0', fontWeight: 'bold', fontSize: 18, marginBottom: 16 }}>Minhas Conexões</div>
          {instances.length === 0 && (
            <div style={{ color: '#888', textAlign: 'center', padding: 32 }}>Nenhuma instância criada ainda.</div>
          )}
          {instances.map((instance) => (
            <div key={instance.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.7em 0", borderBottom: "1px solid #222" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {getStatusIcon(instance.status)}
                <div>
                  <div style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>{instance.name}</div>
                  <div style={{ color: instance.status === 'connected' ? '#0f0' : instance.status === 'disconnected' ? '#f00' : '#ff0', fontSize: 13, fontWeight: 'bold' }}>
                    {instance.status === "connected" ? "Conectado" : instance.status === "disconnected" ? "Desconectado" : "Aguardando conexão"}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => handleRestart(instance.id)} style={{ color: "#0f0", border: "1px solid #0f0", background: "none", fontWeight: "bold", fontFamily: "inherit", fontSize: "1em", padding: "0.3em 1em", borderRadius: 4, cursor: "pointer" }}>
                  Reiniciar
                </button>
                <button onClick={() => handleDisconnect(instance.id)} style={{ color: "#ff0", border: "1px solid #ff0", background: "none", fontWeight: "bold", fontFamily: "inherit", fontSize: "1em", padding: "0.3em 1em", borderRadius: 4, cursor: "pointer" }}>
                  Desconectar
                </button>
                <button onClick={() => handleDelete(instance.id)} style={{ color: "#f00", border: "1px solid #f00", background: "none", fontWeight: "bold", fontFamily: "inherit", fontSize: "1em", padding: "0.3em 1em", borderRadius: 4, cursor: "pointer" }}>
                  Deletar
                </button>
                <button onClick={() => window.location.href = `/conexao/${instance.id}`} style={{ color: "#fff", border: "1px solid #0f0", background: "#0f0", fontWeight: "bold", fontFamily: "inherit", fontSize: "1em", padding: "0.3em 1em", borderRadius: 4, cursor: "pointer" }}>
                  Gerenciar
                </button>
                {instance.status === "disconnected" &&
                  <button onClick={() => handleConnect(instance.id)} style={{ color: "#fff", border: "1px solid #0f0", background: "#222", fontWeight: "bold", fontFamily: "inherit", fontSize: "1em", padding: "0.3em 1em", borderRadius: 4, cursor: "pointer" }}>
                    Conectar
                  </button>
                }
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
// ...existing code...
