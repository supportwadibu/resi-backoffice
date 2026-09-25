import type { PropertySummary } from "@/lib/api/types";
import { formatPrice } from "@/lib/format";
import { PROPERTY_TYPE_LABELS } from "@/lib/labels";

import { PropertyStatusBadge } from "./status-badges";
import { Cell, Row, RowLink, Table } from "./table";

/** Logements réduits à leur résumé : unités d'une résidence, logements autonomes. */
export function PropertySummaryTable({ properties }: { properties: PropertySummary[] }) {
  return (
    <Table head={["Logement", "Type", "Statut", "Prix / jour", "Ville"]}>
      {properties.map((property) => (
        <Row key={property.id}>
          <Cell>
            <RowLink href={`/logements/${property.id}`}>{property.unit_label ?? property.title}</RowLink>
            {property.unit_label && <div className="text-xs text-muted">{property.title}</div>}
          </Cell>
          <Cell>{PROPERTY_TYPE_LABELS[property.property_type]}</Cell>
          <Cell>
            <PropertyStatusBadge status={property.status} />
          </Cell>
          <Cell className="whitespace-nowrap tabular-nums">{formatPrice(property.daily_price)}</Cell>
          <Cell>{property.city}</Cell>
        </Row>
      ))}
    </Table>
  );
}
