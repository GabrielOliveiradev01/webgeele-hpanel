import { PanelShell } from "@/components/panel-shell";

export default function PainelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PanelShell>{children}</PanelShell>;
}
