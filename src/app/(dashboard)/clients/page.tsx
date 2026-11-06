import type { Metadata } from "next";

import { ClientTransfer } from "./client-transfer";

export const metadata: Metadata = { title: "Clients" };

export default function ClientsPage() {
  return <ClientTransfer />;
}
