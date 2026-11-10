import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'cinema-super-secret-jwt-key-algions-2026-production-grade';
const TOKEN_COOKIE_NAME = 'cinema_auth_token';

export interface TokenPayload {
  userId: string;
  email: string;
  fullName: string;
  role: 'CUSTOMER' | 'STAFF' | 'ADMIN';
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export async function getSessionUser(): Promise<TokenPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function setAuthCookie(response: NextResponse, token: string): void {
  response.cookies.set({
    name: TOKEN_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

export function clearAuthCookie(response: NextResponse): void {
  response.cookies.delete(TOKEN_COOKIE_NAME);
}

export async function requireAuth(
  request: NextRequest,
  allowedRoles?: ('CUSTOMER' | 'STAFF' | 'ADMIN')[]
): Promise<{ user: TokenPayload } | { errorResponse: NextResponse }> {
  // Check authorization header first, then cookie
  let token: string | undefined;
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else {
    token = request.cookies.get(TOKEN_COOKIE_NAME)?.value;
  }

  if (!token) {
    return {
      errorResponse: NextResponse.json(
        { error: 'Unauthorized: Authentication required' },
        { status: 401 }
      ),
    };
  }

  const payload = verifyToken(token);
  if (!payload) {
    return {
      errorResponse: NextResponse.json(
        { error: 'Unauthorized: Invalid or expired token' },
        { status: 401 }
      ),
    };
  }

  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(payload.role)) {
      return {
        errorResponse: NextResponse.json(
          { error: `Forbidden: Requires one of [${allowedRoles.join(', ')}] role` },
          { status: 403 }
        ),
      };
    }
  }

  return { user: payload };
}
