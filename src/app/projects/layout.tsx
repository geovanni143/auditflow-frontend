import { ReactNode } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function ProjectsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}