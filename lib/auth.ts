import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { normalizeRole } from '@/lib/roles'

// Vercel sets VERCEL_URL without protocol; NextAuth needs absolute NEXTAUTH_URL
if (!process.env.NEXTAUTH_URL && process.env.VERCEL_URL) {
  process.env.NEXTAUTH_URL = `https://${process.env.VERCEL_URL}`
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null
        }

        const username = credentials.username.toLowerCase().trim()
        const password = credentials.password

        try {
          const user = await prisma.user.findUnique({ where: { username } })
          if (!user) {
            console.warn('[auth] user not found:', username)
            return null
          }

          const ok = user.password.startsWith('$2')
            ? await bcrypt.compare(password, user.password)
            : user.password === password

          if (!ok) {
            console.warn('[auth] bad password for:', username)
            return null
          }

          return {
            id: user.id,
            name: user.name,
            email: user.username.includes('@') ? user.username : `${user.username}@eicpl.com`,
            role: normalizeRole(user.role),
          }
        } catch (err) {
          console.error('[auth] database error during login:', err)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = normalizeRole((user as { role?: string }).role)
        token.id = user.id
      } else if (token.role) {
        token.role = normalizeRole(token.role as string)
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        ;(session.user as any).role = normalizeRole(token.role as string)
        ;(session.user as any).id = token.id
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET || 'truck-management-secret-key-2026',
  // Helps avoid host mismatch issues behind Vercel proxies
  useSecureCookies: process.env.NODE_ENV === 'production',
}
