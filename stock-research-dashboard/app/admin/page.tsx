import AdminWorkspace from "@/components/admin-workspace";
import WorkspaceShell from "@/components/workspace-shell";

export default function AdminPage() {
  return <WorkspaceShell active="admin"><AdminWorkspace /></WorkspaceShell>;
}
