import type { Metadata } from "next";
import Link from "next/link";

import { FilterBar } from "@/components/filter-bar";
import { EmptyState, PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { Select } from "@/components/select";
import { FeedbackStatusBadge } from "@/components/status-badges";
import { apiFetch } from "@/lib/api/client";
import type { Feedback, FeedbackStatus, FeedbackType, Paginated } from "@/lib/api/types";
import { formatDate } from "@/lib/format";
import { FEEDBACK_STATUS_LABELS, FEEDBACK_TYPE_LABELS, toOptions } from "@/lib/labels";
import { enumParam, pageParam } from "@/lib/search-params";

export const metadata: Metadata = { title: "Retours" };

const STATUSES = Object.keys(FEEDBACK_STATUS_LABELS) as FeedbackStatus[];
const TYPES = Object.keys(FEEDBACK_TYPE_LABELS) as FeedbackType[];

export default async function RetoursPage({ searchParams }: PageProps<"/retours">) {
  const params = await searchParams;
  const filters = {
    status: enumParam(params, "status", STATUSES),
    type: enumParam(params, "type", TYPES),
  };

  const { data: feedbacks, meta } = await apiFetch<Paginated<Feedback>>("/admin/feedbacks", {
    query: { ...filters, page: pageParam(params), per_page: 25 },
  });

  return (
    <div>
      <PageHeader title="Retours utilisateurs" description="Suggestions et signalements envoyés depuis l'application." />

      <FilterBar
        key={JSON.stringify(filters)}
        path="/retours"
        active={filters.status !== undefined || filters.type !== undefined}
      >
        <Select
          label="Statut"
          name="status"
          defaultValue={filters.status ?? ""}
          placeholder="Tous"
          options={toOptions(FEEDBACK_STATUS_LABELS)}
        />
        <Select
          label="Type"
          name="type"
          defaultValue={filters.type ?? ""}
          placeholder="Tous"
          options={toOptions(FEEDBACK_TYPE_LABELS)}
        />
      </FilterBar>

      {feedbacks.length === 0 ? (
        <EmptyState>Aucun retour ne correspond à ces critères.</EmptyState>
      ) : (
        <ul className="flex flex-col gap-3">
          {feedbacks.map((feedback) => (
            <li key={feedback.id}>
              <Link
                href={`/retours/${feedback.id}`}
                className="block border border-border bg-surface p-4 hover:border-primary"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="font-medium">{feedback.title}</h2>
                  <span className="flex items-center gap-2 text-xs text-muted">
                    {FEEDBACK_TYPE_LABELS[feedback.type]}
                    <FeedbackStatusBadge status={feedback.status} />
                    {formatDate(feedback.created_at)}
                  </span>
                </div>
                <p className="mt-2 line-clamp-3 text-sm whitespace-pre-line">{feedback.message}</p>
                <p className="mt-2 text-xs text-muted">{feedback.user_snapshot.full_name}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Pagination meta={meta} path="/retours" filters={filters} noun={["retour", "retours"]} />
    </div>
  );
}
