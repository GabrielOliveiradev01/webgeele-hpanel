import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/page-header";

export function SectionPlaceholder({
  title,
  description,
  bullets,
}: {
  title: string;
  description: string;
  bullets: string[];
}) {
  return (
    <div>
      <PageHeader
        title={title}
        description={description}
        actions={
          <Link
            href="/"
            className="wg-btn-secondary px-3.5 py-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Visão geral
          </Link>
        }
      />

      <div className="wg-card p-6 sm:p-8">
        <p className="text-sm font-medium text-wg-brand">Em construção</p>
        <h2 className="mt-2 font-display text-xl font-semibold text-wg-graphite">
          Escopo desta área
        </h2>
        <ul className="mt-5 space-y-3">
          {bullets.map((bullet) => (
            <li key={bullet} className="flex items-start gap-3 text-sm text-wg-text-muted">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-r from-wg-brand to-wg-pink" />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
