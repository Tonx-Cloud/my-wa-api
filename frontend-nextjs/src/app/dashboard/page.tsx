'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { API_ROUTES, fetchApi } from '@/lib/api'

// Evita hydration mismatch ao formatar número apenas no client
function TodayMessages({ value }: { value: number }) {
  const [formatted, setFormatted] = useState<string | number>(value);
  useEffect(() => {
    setFormatted(value.toLocaleString());
  }, [value]);
  return <div style={{ fontSize: 28, fontWeight: 'bold' }}>{formatted}</div>;
}

import { 
  MessageSquare, 
  Users, 
  Activity, 
  TrendingUp,
  Smartphone,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react'

interface DashboardStats {
  activeInstances: number
  todayMessages: number
  deliveryRate: number
  onlineUsers: number
}

interface Instance {
  id: string
  name: string
  status: 'connected' | 'disconnected' | 'connecting'
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<DashboardStats>({
    activeInstances: 0,
    todayMessages: 0,
    deliveryRate: 0,
    onlineUsers: 0
  })
  const [instances, setInstances] = useState<Instance[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Buscar instâncias primeiro (sabemos que esta rota existe)
      const instRes = await fetchApi(API_ROUTES.instances);
      const instData = await instRes.json();
      setInstances(instData);
      
      try {
        // Tentar buscar estatísticas do dashboard
        const statsRes = await fetchApi(API_ROUTES.dashboard);
        const statsData = await statsRes.json();
        setStats(statsData);
      } catch (statsError) {
        console.warn('Erro ao buscar estatísticas do dashboard:', statsError);
        // Calcular estatísticas básicas a partir das instâncias
        setStats(prev => ({
          ...prev,
          activeInstances: instData.filter(i => i.status === 'connected').length,
          onlineUsers: instData.length
        }));
      }
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'disconnected':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'connecting':
        return <Clock className="h-5 w-5 text-yellow-500" />
      default:
        return <XCircle className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected':
        return 'Conectado'
      case 'disconnected':
        return 'Desconectado'
      case 'connecting':
        return 'Conectando'
      default:
        return 'Desconhecido'
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div style={{ minHeight: '40vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', color: '#0f0', fontFamily: 'Consolas, Courier New, monospace' }}>
          <span>Carregando...</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 900, margin: '0 auto', marginTop: 32 }}>
        <h1 style={{ color: '#0f0', fontWeight: 'bold', fontSize: '2em', marginBottom: 8, letterSpacing: 1 }}>Dashboard</h1>
        <p style={{ color: '#fff', marginBottom: 32 }}>Bem-vindo de volta, {session?.user?.name}!</p>

        {/* Stats - estilo retrô */}
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 32 }}>
          <div style={{ flex: 1, minWidth: 180, background: 'none', border: '1px solid #0f0', color: '#0f0', padding: 20, borderRadius: 8, fontFamily: 'inherit' }}>
            <div style={{ fontSize: 16, marginBottom: 8 }}>Instâncias Ativas</div>
            <div style={{ fontSize: 28, fontWeight: 'bold' }}>{stats.activeInstances}</div>
          </div>
          <div style={{ flex: 1, minWidth: 180, background: 'none', border: '1px solid #0f0', color: '#0f0', padding: 20, borderRadius: 8, fontFamily: 'inherit' }}>
            <div style={{ fontSize: 16, marginBottom: 8 }}>Mensagens Hoje</div>
            <TodayMessages value={stats.todayMessages} />

          </div>
          <div style={{ flex: 1, minWidth: 180, background: 'none', border: '1px solid #0f0', color: '#0f0', padding: 20, borderRadius: 8, fontFamily: 'inherit' }}>
            <div style={{ fontSize: 16, marginBottom: 8 }}>Taxa de Entrega</div>
            <div style={{ fontSize: 28, fontWeight: 'bold' }}>{stats.deliveryRate}%</div>
          </div>
          <div style={{ flex: 1, minWidth: 180, background: 'none', border: '1px solid #0f0', color: '#0f0', padding: 20, borderRadius: 8, fontFamily: 'inherit' }}>
            <div style={{ fontSize: 16, marginBottom: 8 }}>Usuários Online</div>
            <div style={{ fontSize: 28, fontWeight: 'bold' }}>{stats.onlineUsers}</div>
          </div>
        </div>

        {/* Status das Instâncias - retrô */}
        <div style={{ border: '1px solid #0f0', borderRadius: 8, marginBottom: 32, background: 'none' }}>
          <div style={{ borderBottom: '1px solid #0f0', padding: '1em', color: '#0f0', fontWeight: 'bold', fontSize: 18 }}>Status das Instâncias</div>
          <div style={{ padding: '1em' }}>
            {instances.map((instance) => (
              <div key={instance.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.7em 0', borderBottom: '1px solid #222' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {getStatusIcon(instance.status)}
                  <div>
                    <div style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{instance.name}</div>
                    <div style={{ color: '#0f0', fontSize: 13 }}>{getStatusText(instance.status)}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={{ color: '#0f0', border: '1px solid #0f0', background: 'none', fontWeight: 'bold', fontFamily: 'inherit', fontSize: '1em', padding: '0.3em 1em', borderRadius: 4, cursor: 'pointer' }}>
                    Gerenciar
                  </button>
                  {instance.status === 'disconnected' && (
                    <button style={{ color: '#fff', border: '1px solid #0f0', background: '#222', fontWeight: 'bold', fontFamily: 'inherit', fontSize: '1em', padding: '0.3em 1em', borderRadius: 4, cursor: 'pointer' }}>
                      Conectar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ações rápidas e recursos - retrô */}
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 260, border: '1px solid #0f0', borderRadius: 8, padding: 20, background: 'none', color: '#0f0', marginBottom: 24 }}>
            <div style={{ fontWeight: 'bold', fontSize: 17, marginBottom: 12 }}>Ações Rápidas</div>
            <button style={{ width: '100%', color: '#0f0', border: '1px solid #0f0', background: 'none', fontWeight: 'bold', fontFamily: 'inherit', fontSize: '1em', padding: '0.7em 0', marginBottom: 8, borderRadius: 4, cursor: 'pointer' }}>
              Nova Instância
            </button>
            <button style={{ width: '100%', color: '#0f0', border: '1px solid #0f0', background: 'none', fontWeight: 'bold', fontFamily: 'inherit', fontSize: '1em', padding: '0.7em 0', marginBottom: 8, borderRadius: 4, cursor: 'pointer' }}>
              Enviar Mensagem
            </button>
            <button style={{ width: '100%', color: '#0f0', border: '1px solid #0f0', background: 'none', fontWeight: 'bold', fontFamily: 'inherit', fontSize: '1em', padding: '0.7em 0', borderRadius: 4, cursor: 'pointer' }}>
              Ver Logs
            </button>
          </div>
          <div style={{ flex: 1, minWidth: 260, border: '1px solid #0f0', borderRadius: 8, padding: 20, background: 'none', color: '#0f0', marginBottom: 24 }}>
            <div style={{ fontWeight: 'bold', fontSize: 17, marginBottom: 12 }}>Atividade Recente</div>
            <div style={{ color: '#fff', fontSize: 15, marginBottom: 8 }}>Instância "Vendas" conectada</div>
            <div style={{ color: '#fff', fontSize: 15, marginBottom: 8 }}>247 mensagens enviadas</div>
            <div style={{ color: '#fff', fontSize: 15, marginBottom: 8 }}>Webhook configurado</div>
            <div style={{ color: '#fff', fontSize: 15 }}>Instância "Teste" desconectada</div>
          </div>
          <div style={{ flex: 1, minWidth: 260, border: '1px solid #0f0', borderRadius: 8, padding: 20, background: 'none', color: '#0f0', marginBottom: 24 }}>
            <div style={{ fontWeight: 'bold', fontSize: 17, marginBottom: 12 }}>Recursos</div>
            <a href="/docs" style={{ display: 'block', color: '#fff', border: '1px solid #0f0', background: 'none', fontWeight: 'bold', fontFamily: 'inherit', fontSize: '1em', padding: '0.7em 0', marginBottom: 8, borderRadius: 4, textDecoration: 'none' }}>
              Documentação
            </a>
            <a href="/sdk" style={{ display: 'block', color: '#fff', border: '1px solid #0f0', background: 'none', fontWeight: 'bold', fontFamily: 'inherit', fontSize: '1em', padding: '0.7em 0', marginBottom: 8, borderRadius: 4, textDecoration: 'none' }}>
              SDK
            </a>
            <a href="/webhook" style={{ display: 'block', color: '#fff', border: '1px solid #0f0', background: 'none', fontWeight: 'bold', fontFamily: 'inherit', fontSize: '1em', padding: '0.7em 0', borderRadius: 4, textDecoration: 'none' }}>
              Webhooks
            </a>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
