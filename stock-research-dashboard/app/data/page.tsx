import DataWorkspace from "@/components/data-workspace";
import WorkspaceShell from "@/components/workspace-shell";

export default function DataPage() {
  return <WorkspaceShell active="data"><DataWorkspace /></WorkspaceShell>;
}
