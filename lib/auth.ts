import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { normalizeRole } from '@/lib/roles'

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

        const user = await prisma.user.findUnique({ where: { username } })
        if (!user) return null

        const ok = user.password.startsWith('$2')
          ? await bcrypt.compare(password, user.password)
          : user.password === password

        if (!ok) return null

        return {
          id: user.id,
          name: user.name,
          email: user.username.includes('@') ? user.username : `${user.username}@eicpl.com`,
          role: normalizeRole(user.role),
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
}
