import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { isAdminSession } from "../lib/auth";

export function RequireAdmin({ children }: { children: ReactNode }) {
  if (!isAdminSession()) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
