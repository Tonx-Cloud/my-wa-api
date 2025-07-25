'use client'

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function HomePage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', color: '#0f0', fontFamily: 'Consolas, Courier New, monospace' }}>
        <span>Carregando...</span>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#fff', fontFamily: 'Consolas, Courier New, monospace' }}>
      <div className="retro-border" style={{ maxWidth: 600, margin: '4em auto', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.2em', color: '#0f0', marginBottom: '0.5em', fontWeight: 'bold', letterSpacing: '0.05em' }}>
          WhatsApp API Portal
        </h1>
        <pre style={{ color: '#fff', background: 'none', fontSize: '1.1em', marginBottom: '1.5em' }}>
{`Bem-vindo ao sistema de automação WhatsApp!

Faça login para acessar o painel.`}
        </pre>
        <Link
          href="/login"
          style={{ color: '#0f0', border: '1px solid #fff', background: 'none', padding: '0.5em 2em', fontWeight: 'bold', fontFamily: 'inherit', fontSize: '1.1em', textDecoration: 'none', display: 'inline-block' }}
        >
          Entrar
        </Link>
      </div>
    </div>
  );
}