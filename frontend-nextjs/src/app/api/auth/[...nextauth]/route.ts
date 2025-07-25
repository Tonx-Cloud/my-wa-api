import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { NextAuthOptions } from 'next-auth'

const authOptions: NextAuthOptions = {
  debug: true,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "select_account"
        }
      }
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Fazer chamada para o backend Express para validar credenciais
          const response = await fetch(`${process.env.BACKEND_URL}/api/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          })

          if (!response.ok) {
            console.error('Auth response not ok:', response.status, response.statusText)
            return null
          }

          const text = await response.text()
          if (!text) {
            console.error('Empty response from backend')
            return null
          }

          let data
          try {
            data = JSON.parse(text)
          } catch (parseError) {
            console.error('Failed to parse JSON response:', text)
            return null
          }

          if (data.success) {
            return {
              id: data.user.id,
              email: data.user.email,
              name: data.user.name,
              role: data.user.role,
              plan: data.user.plan,
            }
          }
          return null
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      try {
        console.log('SignIn callback:', { user, account, profile });
        return true;
      } catch (error) {
        console.error('SignIn callback error:', error);
        return false;
      }
    },
    redirect({ url, baseUrl }) {
      console.log('Redirect callback:', { url, baseUrl });
      
      // Se a URL é relativa, construir URL completa
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      
      // Se a URL é completa, verificar e ajustar porta se necessário
      try {
        const targetUrl = new URL(url);
        if (targetUrl.hostname === 'localhost') {
          targetUrl.port = '3000';
          return targetUrl.toString();
        }
      } catch (error) {
        console.error('Error parsing URL in redirect:', error);
        // Fallback para baseUrl se URL é inválida
        return baseUrl;
      }
      
      // Verificar se URL começa com baseUrl ou retornar baseUrl
      return url.startsWith(baseUrl) ? url : baseUrl;
    },
    async jwt({ token, user, account }) {
      console.log('JWT callback:', { token, user, account });
      
      if (user) {
        token.role = user.role || 'user'
        token.plan = user.plan || 'free'
      }
      
      // Para login com Google, fazer chamada para o backend
      if (account?.provider === 'google' && user) {
        try {
          console.log('Attempting Google sync with backend');
          const response = await fetch(`${process.env.BACKEND_URL}/api/auth/google-sync`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              googleId: account.providerAccountId,
              email: user.email,
              name: user.name,
              image: user.image,
            }),
          })

          if (!response.ok) {
            console.error('Google sync failed:', response.status, response.statusText);
            // Ainda retornamos o token com valores padrão
            return token;
          }

          const text = await response.text();
          if (!text) {
            console.warn('Empty response from Google sync');
            return token;
          }

          let data
          try {
            data = JSON.parse(text);
          } catch (parseError) {
            console.error('Failed to parse Google sync response:', text);
            return token;
          }

          if (data.success) {
            token.role = data.user.role
            token.plan = data.user.plan
            token.id = data.user.id
          } else {
            console.warn('Google sync success=false:', data);
          }
        } catch (error) {
          console.error('Google sync error:', error)
          // Não falhar o login se o sync falhar
        }
      }

      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.plan = token.plan as string
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
