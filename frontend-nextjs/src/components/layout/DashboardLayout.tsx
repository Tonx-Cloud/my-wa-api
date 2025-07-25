'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { 
  Home, 
  MessageSquare, 
  Settings, 
  Webhook, 
  Bot, 
  DollarSign, 
  FileText, 
  User, 
  Code, 
  LogOut,
  Menu,
  X,
  MessageCircle
} from 'lucide-react'

interface DashboardLayoutProps {
  children: React.ReactNode
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Chat', href: '/chat', icon: MessageCircle },
  { name: 'Conexões', href: '/conexao', icon: MessageSquare },
  { name: 'Webhook', href: '/webhook', icon: Webhook },
  { name: 'Configurações', href: '/configuracoes', icon: Settings },
  { name: 'GPT', href: '/gpt', icon: Bot },
  { name: 'Financeiro', href: '/financeiro', icon: DollarSign },
  { name: 'Documentação', href: '/docs', icon: FileText },
  { name: 'SDK', href: '/sdk', icon: Code },
]

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (status === 'loading') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', color: '#0f0', fontFamily: 'Consolas, Courier New, monospace' }}>
        <span>Carregando...</span>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  }  

  return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#fff', fontFamily: 'Consolas, Courier New, monospace', display: 'flex' }}>
      {/* Sidebar retrô */}
      <div style={{ width: 240, minHeight: '100vh', background: '#111', borderRight: '2px solid #0f0', display: 'flex', flexDirection: 'column', padding: '2em 0 0 0' }}>
        <div style={{ textAlign: 'center', marginBottom: '2em' }}>
          <div style={{ fontSize: 32, color: '#0f0', fontWeight: 'bold', letterSpacing: 2 }}>WA API</div>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              style={{
                color: '#fff',
                background: 'none',
                border: '1px solid #0f0',
                borderLeft: '4px solid #0f0',
                borderRadius: 0,
                fontWeight: 'bold',
                fontFamily: 'inherit',
                fontSize: '1.05em',
                padding: '0.7em 1em',
                margin: '0 1em 0.5em 1em',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                textDecoration: 'none',
                transition: 'background 0.2s',
                boxShadow: '0 0 0 1px #0f0 inset',
              }}
            >
              <item.icon style={{ color: '#0f0', width: 20, height: 20 }} />
              {item.name}
            </Link>
          ))}
        </nav>
        <div style={{ marginTop: 'auto', textAlign: 'center', padding: '2em 0 1em 0' }}>
          <button onClick={handleSignOut} style={{ color: '#f00', background: 'none', border: '1px solid #f00', fontWeight: 'bold', fontFamily: 'inherit', fontSize: '1em', padding: '0.5em 2em', cursor: 'pointer' }}>
            <LogOut style={{ marginRight: 8, verticalAlign: 'middle' }} /> Sair
          </button>
        </div>
      </div>

      {/* Conteúdo principal retrô */}
      <div style={{ flex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Topbar retrô */}
        <div style={{ background: '#111', borderBottom: '2px solid #0f0', padding: '1em 2em', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ color: '#0f0', fontWeight: 'bold', fontSize: '1.1em' }}>
            {session?.user?.name} <span style={{ color: '#fff', fontWeight: 'normal', fontSize: '0.9em', marginLeft: 12 }}>{session?.user?.email}</span>
          </div>
          <Link href="/profile" style={{ color: '#0f0', textDecoration: 'underline', fontWeight: 'bold', fontSize: '1em' }}>Perfil</Link>
        </div>
        <main style={{ flex: 1, padding: '2em 0', minHeight: '100vh' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 2em' }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
