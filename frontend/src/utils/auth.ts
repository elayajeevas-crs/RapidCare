import type { AuthUser } from '../services/api';
export const getUser = (): AuthUser | null => { try { return JSON.parse(localStorage.getItem('user') ?? 'null'); } catch { return null; } };
export const saveSession = (token: string, user: AuthUser) => { localStorage.setItem('token', token); localStorage.setItem('user', JSON.stringify(user)); };
export const logout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); window.location.href = '/login'; };
export const homeFor = (r: string) => (r === 'ADMIN' ? '/admin' : r === 'FACILITY' ? '/facility' : '/emergency');
