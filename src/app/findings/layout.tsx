import { ReactNode } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function FindingsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}