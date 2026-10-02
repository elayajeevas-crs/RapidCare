import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { getUser } from '../utils/auth';
export default function RequireRole({ role, children }: { role: string; children: ReactNode }) {
  const u = getUser();
  return u && u.role === role ? <>{children}</> : <Navigate to="/login" replace />;
}
