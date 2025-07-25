'use client'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Email ou senha incorretos')
      } else {
        router.push(callbackUrl)
      }
    } catch (err) {
      setError('Erro interno do servidor')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    try {
      const result = await signIn('google', { 
        callbackUrl,
        redirect: false 
      })
      
      if (result?.error) {
        console.error('Google sign in error:', result.error)
        setError(`Erro ao fazer login com Google: ${result.error}`)
      } else {
        // Redirecionar manualmente após sucesso
        window.location.href = callbackUrl
      }
    } catch (err) {
      console.error('Google sign in exception:', err)
      setError('Erro ao fazer login com Google')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#fff', fontFamily: 'Consolas, Courier New, monospace', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="retro-border" style={{ width: 400, maxWidth: '100%' }}>
        <h1 style={{ color: '#0f0', fontWeight: 'bold', fontSize: '1.5em', marginBottom: '1em', textAlign: 'center' }}>
          Login - WhatsApp API
        </h1>
        {error && (
          <div style={{ color: '#f00', background: 'none', border: '1px solid #f00', padding: '0.5em', marginBottom: '1em', textAlign: 'center' }}>{error}</div>
        )}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1em' }}>
          <label>
            Email:
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              style={{ width: '100%', marginTop: 4, marginBottom: 8 }}
              placeholder="seu@email.com"
            />
          </label>
          <label>
            Senha:
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              style={{ width: '100%', marginTop: 4, marginBottom: 8 }}
              placeholder="********"
            />
          </label>
          <button type="submit" disabled={loading} style={{ color: '#0f0', border: '1px solid #fff', background: 'none', fontWeight: 'bold', fontFamily: 'inherit', fontSize: '1.1em', padding: '0.5em 0' }}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        <div style={{ margin: '1.5em 0', color: '#888', fontSize: '0.95em', textAlign: 'center' }}>
          <div>Credenciais de teste:</div>
          <div>Email: admin@example.com</div>
          <div>Senha: senha123</div>
        </div>
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          style={{ color: '#0f0', border: '1px solid #fff', background: 'none', fontWeight: 'bold', fontFamily: 'inherit', fontSize: '1.1em', width: '100%', padding: '0.5em 0', marginTop: '1em' }}
        >
          Entrar com Google
        </button>
      </div>
    </div>
  )
}
