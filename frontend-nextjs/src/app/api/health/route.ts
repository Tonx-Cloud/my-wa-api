import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    // Teste de conectividade com o backend
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001'
    
    try {
      const response = await fetch(`${backendUrl}/api/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Adicionar timeout para evitar hang
        signal: AbortSignal.timeout(5000)
      })
      
      if (!response.ok) {
        return NextResponse.json(
          { 
            error: 'Backend not reachable', 
            status: response.status,
            statusText: response.statusText,
            backendUrl 
          },
          { status: 503 }
        )
      }
      
      const text = await response.text()
      let backendData
      
      try {
        backendData = text ? JSON.parse(text) : { message: 'Empty response' }
      } catch (parseError) {
        backendData = { error: 'Invalid JSON response', response: text }
      }
      
      return NextResponse.json({
        status: 'ok',
        backend: backendData,
        backendUrl,
        environment: {
          NEXTAUTH_URL: process.env.NEXTAUTH_URL,
          BACKEND_URL: process.env.BACKEND_URL,
          GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? '***CONFIGURED***' : 'NOT SET',
        }
      })
      
    } catch (fetchError) {
      return NextResponse.json(
        { 
          error: 'Backend connection failed',
          message: fetchError instanceof Error ? fetchError.message : 'Connection timeout or refused',
          backendUrl,
          suggestion: 'Verifique se o backend está rodando na porta 3001'
        },
        { status: 503 }
      )
    }
    
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
