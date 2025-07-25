'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

export default function AuthTest() {
  const { data: session, status } = useSession()
  const [apiHealth, setApiHealth] = useState<any>(null)

  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setApiHealth(data))
      .catch(err => setApiHealth({ error: err.message }))
  }, [])

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>🔧 Teste de Autenticação - WhatsApp API</h2>
      
      <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ccc' }}>
        <h3>📊 Status da Sessão</h3>
        <p><strong>Status:</strong> {status}</p>
        {session ? (
          <div>
            <p><strong>Usuário:</strong> {session.user?.name}</p>
            <p><strong>Email:</strong> {session.user?.email}</p>
            <p><strong>Imagem:</strong> {session.user?.image}</p>
          </div>
        ) : (
          <p>Nenhuma sessão ativa</p>
        )}
      </div>

      <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ccc' }}>
        <h3>🌐 Saúde da API</h3>
        {apiHealth ? (
          <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
            {JSON.stringify(apiHealth, null, 2)}
          </pre>
        ) : (
          <p>Carregando...</p>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>🔗 Links Úteis</h3>
        <ul>
          <li><a href="/api/auth/signin">Fazer Login</a></li>
          <li><a href="/api/auth/signout">Fazer Logout</a></li>
          <li><a href="/api/auth/session">Ver Sessão (JSON)</a></li>
          <li><a href="/api/health">Health Check</a></li>
        </ul>
      </div>
    </div>
  )
}
