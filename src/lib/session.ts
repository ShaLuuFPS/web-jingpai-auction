import { getIronSession, SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';

export interface SessionData {
  userId?: string;
  username?: string;
  nickname?: string;
  role?: string;
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || 'a-very-long-and-secure-password-that-is-at-least-32-chars',
  cookieName: 'jingpai-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
  },
};

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session.userId) return null;
  return {
    userId: session.userId,
    username: session.username!,
    nickname: session.nickname!,
    role: session.role!,
  };
}
