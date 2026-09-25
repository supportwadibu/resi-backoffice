import { ClipboardList, Cpu, MessageSquare, UserRound } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { DetailList, PageHeader, Section } from "@/components/page-header";
import { FeedbackStatusBadge } from "@/components/status-badges";
import { apiFetchOrNotFound } from "@/lib/api/client";
import type { Feedback } from "@/lib/api/types";
import { formatDateTime } from "@/lib/format";
import { FEEDBACK_TYPE_LABELS } from "@/lib/labels";

import { FeedbackForm } from "./feedback-form";

export const metadata: Metadata = { title: "Retour" };

export default async function RetourDetailPage({
  params,
}: PageProps<"/retours/[id]">) {
  const { id } = await params;
  const { data: feedback } = await apiFetchOrNotFound<{ data: Feedback }>(
    `/admin/feedbacks/${encodeURIComponent(id)}`,
  );
  const { context, user_snapshot: author } = feedback;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        back={{ href: "/retours", label: "Retours" }}
        title={feedback.title}
        description={
          <span className="flex flex-wrap items-center gap-2">
            {FEEDBACK_TYPE_LABELS[feedback.type]}
            <FeedbackStatusBadge status={feedback.status} />
            {formatDateTime(feedback.created_at)}
          </span>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="flex flex-col gap-6">
          <Section title="Message" icon={MessageSquare}>
            <p className="text-sm whitespace-pre-line">{feedback.message}</p>
          </Section>
          <Section title="Traitement" icon={ClipboardList}>
            <FeedbackForm key={feedback.updated_at} feedback={feedback} />
          </Section>
        </div>

        <div className="flex flex-col gap-6">
          <Section title="Auteur" icon={UserRound}>
            <DetailList
              items={[
                [
                  "Nom",
                  <Link
                    key="author"
                    href={`/comptes/${feedback.user_id}`}
                    className="underline-offset-4 hover:underline"
                  >
                    {author.full_name}
                  </Link>,
                ],
                ["Téléphone", author.phone],
                ["E-mail", author.email],
              ]}
            />
          </Section>
          <Section title="Contexte technique" icon={Cpu}>
            <DetailList
              items={[
                ["Version", context.app_version],
                ["Environnement", context.flavor],
                [
                  "Plateforme",
                  [context.platform, context.os_version]
                    .filter(Boolean)
                    .join(" ") || null,
                ],
                ["Appareil", context.device_model],
              ]}
            />
          </Section>
        </div>
      </div>
    </div>
  );
}
