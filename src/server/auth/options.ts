import { type AuthOptions } from 'next-auth';
import { type AppError } from '@/types/app';
import { logger } from '@/server/logging/pino';

export const authOptions: AuthOptions = {
  providers: [
    // Configurar provedores de autenticação aqui
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        // Lógica de signIn
        return true;
      } catch (error) {
        logger.error({
          msg: 'Sign in error',
          error: error as AppError,
          userId: user.id,
          provider: account?.provider
        });
        return false;
      }
    },
    async session({ session, token }) {
      try {
        // Adicionar dados do token à sessão
        return {
          ...session,
          user: {
            ...session.user,
            id: token.sub
          }
        };
      } catch (error) {
        logger.error({
          msg: 'Session callback error',
          error: error as AppError,
          sessionId: session.id
        });
        return session;
      }
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  events: {
    async signIn({ user, account, isNewUser }) {
      logger.info({
        msg: 'User signed in',
        userId: user.id,
        provider: account?.provider,
        isNewUser
      });
    },
    async signOut({ session }) {
      logger.info({
        msg: 'User signed out',
        sessionId: session.id
      });
    }
  }
};

export async function initializeAuth(): Promise<void> {
  try {
    // Inicialização adicional de autenticação se necessário
    logger.info({
      msg: 'Auth initialized successfully'
    });
  } catch (error) {
    const appError: AppError = {
      code: 'AUTH_INITIALIZATION_ERROR',
      message: error instanceof Error ? error.message : 'Failed to initialize auth',
      stack: error instanceof Error ? error.stack : undefined
    };

    logger.error({
      msg: 'Failed to initialize auth',
      error: appError
    });

    throw appError;
  }
}