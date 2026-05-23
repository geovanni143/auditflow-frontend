import { ReactNode } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function UsersLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <ProtectedRoute requiredRole="ADMIN">{children}</ProtectedRoute>;
}