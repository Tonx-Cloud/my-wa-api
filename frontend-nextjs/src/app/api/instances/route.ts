import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export async function GET(request: NextRequest) {
    try {
        const response = await fetch(`${BACKEND_URL}/api/instances`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: 'include',
        });

        if (!response.ok) {
            const text = await response.text();
            return NextResponse.json(
                { error: 'Backend request failed', details: text },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Error proxying GET request to backend:', error);
        return NextResponse.json(
            { error: 'Failed to connect to backend', details: error.message },
            { status: 503 }
        );
    }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${BACKEND_URL}/api/instances`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json({ error: 'Network response was not ok', details: text }, { status: response.status });
    }
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await response.text();
      return NextResponse.json({ error: 'Resposta não é JSON', details: text }, { status: 500 });
    }
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating instance:', error);
    return NextResponse.json({ error: 'Failed to create instance' }, { status: 500 });
  }
}
