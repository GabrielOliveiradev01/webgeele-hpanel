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
            className="inline-flex items-center gap-2 rounded-xl border border-wg-border bg-white px-3.5 py-2 text-sm font-medium text-wg-graphite transition hover:border-wg-purple/30 hover:text-wg-purple"
          >
            <ArrowLeft className="h-4 w-4" />
            Visão geral
          </Link>
        }
      />

      <div className="rounded-2xl border border-wg-border bg-white p-6 shadow-[0_10px_30px_rgba(33,27,58,0.04)] sm:p-8">
        <p className="text-sm font-medium text-wg-purple">Em construção</p>
        <h2 className="mt-2 font-display text-xl font-semibold text-wg-graphite">
          Escopo desta área
        </h2>
        <ul className="mt-5 space-y-3">
          {bullets.map((bullet) => (
            <li key={bullet} className="flex items-start gap-3 text-sm text-wg-text-muted">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-r from-wg-purple to-wg-pink" />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
