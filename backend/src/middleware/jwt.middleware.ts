import express from 'express';
import jwt from 'jsonwebtoken';

export interface AuthPayload {
  sub: string;        // user id
  role?: string;
  iat?: number;
  exp?: number;
}

/**
 * JWT Validation Middleware
 * Extracts and validates JWT token from Authorization header
 * Attaches user info to request object if valid
 */
export function jwtMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      message: 'Unauthorized',
      detail: 'Missing Authorization header'
    });
  }

  // Extract token from "Bearer <token>"
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({
      message: 'Unauthorized',
      detail: 'Invalid Authorization header format. Use "Bearer <token>"'
    });
  }

  const token = parts[1];
  const secret = process.env.JWT_SECRET || 'dev-secret';

  try {
    const payload = jwt.verify(token, secret) as AuthPayload;
    
    // Attach user info to request for downstream handlers
    (req as any).user = payload;
    
    console.log(`[JWT] Token validated for user: ${payload.sub}`);
    next();
  } catch (error: any) {
    console.error(`[JWT] Token validation failed:`, error.message);
    
    return res.status(401).json({
      message: 'Unauthorized',
      detail: error.message
    });
  }
}

/**
 * Optional middleware - doesn't fail if token is missing
 * Useful for routes that can work with or without auth
 */
export function optionalJwtMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next();
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return next();
  }

  const token = parts[1];
  const secret = process.env.JWT_SECRET || 'dev-secret';

  try {
    const payload = jwt.verify(token, secret) as AuthPayload;
    (req as any).user = payload;
    console.log(`[JWT] Optional token validated for user: ${payload.sub}`);
  } catch (error: any) {
    console.warn(`[JWT] Optional token validation failed:`, error.message);
  }

  next();
}
