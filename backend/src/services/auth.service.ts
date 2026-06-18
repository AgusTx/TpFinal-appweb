import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { CreateUserDto } from '../dtos/user.dto';

type StoredUser = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
  createdAt: string;
};

const users: StoredUser[] = [];

export function register(dto: CreateUserDto) {
  if (users.find(u => u.email === dto.email)) {
    throw new Error('Email already registered');
  }

  const hashed = bcrypt.hashSync(dto.password, 8);
  const user: StoredUser = {
    id: `user-${Date.now()}`,
    name: dto.name,
    email: dto.email,
    password: hashed,
    role: dto.role || 'user',
    createdAt: new Date().toISOString()
  };

  users.push(user);
  // Do not return password
  const { password, ...safe } = user as any;
  return safe as Omit<StoredUser, 'password'>;
}

export function login(email: string, password: string) {
  const user = users.find(u => u.email === email);
  if (!user) throw new Error('Invalid credentials');

  const ok = bcrypt.compareSync(password, user.password);
  if (!ok) throw new Error('Invalid credentials');

  const token = jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
  const { password: _p, ...safe } = user as any;
  return { user: safe, token };
}
