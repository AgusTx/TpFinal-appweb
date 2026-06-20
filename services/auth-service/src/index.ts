import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
}

const users: User[] = [];
const app = express();
app.use(express.json());

const jwtSecret = process.env.AUTH_JWT_SECRET || 'super-secret-key';
const jwtExpiresIn = process.env.AUTH_JWT_EXPIRES_IN || '1h';

app.get('/health', (_req: Request, res: Response) => res.json({ status: 'ok', service: 'auth' }));

app.post('/register', async (req: Request, res: Response) => {
  const { email, password, name } = req.body as { email?: string; password?: string; name?: string };
  const errors: string[] = [];

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    errors.push('email must be a valid email address');
  }
  if (!password || typeof password !== 'string' || password.length < 6) {
    errors.push('password must be at least 6 characters');
  }
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('name must be at least 2 characters');
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: 'Validation failed', errors });
  }

  const normalizedEmail = email.toLowerCase().trim();
  if (users.some((user) => user.email === normalizedEmail)) {
    return res.status(409).json({ message: 'Email already registered' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const newUser: User = {
    id: `user-${Date.now()}`,
    email: normalizedEmail,
    passwordHash,
    name: name.trim(),
  };

  users.push(newUser);
  return res.status(201).json({ id: newUser.id, email: newUser.email, name: newUser.name });
});

app.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const user = users.find((stored) => stored.email === email.toLowerCase().trim());
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const passwordValid = await bcrypt.compare(password, user.passwordHash);
  if (!passwordValid) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign({ sub: user.id, email: user.email, name: user.name }, jwtSecret, {
    expiresIn: jwtExpiresIn,
  });

  return res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
});

const PORT = process.env.PORT || 4100;
app.listen(PORT, () => {
  console.log(`Auth service running on http://localhost:${PORT}`);
});
