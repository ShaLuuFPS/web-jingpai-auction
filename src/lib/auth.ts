import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';

/** Require admin role — use in API routes and admin layout */
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    throw new Error('Unauthorized');
  }
  return user;
}

/** Require logged in — use in API routes and layout */
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  if (!user.userId) {
    throw new Error('Unauthorized');
  }
  return user;
}

/** Check if user is admin and return boolean */
export async function isAdmin() {
  const user = await getCurrentUser();
  return user?.role === 'admin';
}
