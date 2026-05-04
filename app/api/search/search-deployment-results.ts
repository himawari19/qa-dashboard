import { codeFromId } from "@/lib/utils";
import { buildFilterClause, buildResult, buildSearchSql, escapeLike, extractExactId, normalize, queryFirst, queryRows, type Row, type SearchFilters, type SearchResult } from "./search-helpers";

export async function getDeploymentResults(query: string, companyClause: string, companyParams: unknown[], filters: SearchFilters = {}) {
  const exactId = extractExactId(query, "DEP");
  if (exactId !== null) {
    const exactRow = await queryFirst<Row>(
      `SELECT id, date, version, project, environment, developer, changelog, status, notes, updatedAt
       FROM "Deployment"
       WHERE id = ?${companyClause}
       ORDER BY "updatedAt" DESC
       LIMIT 1`,
      [exactId, ...companyParams],
    );
    if (exactRow) {
      const exactItem = buildResult({
        row: exactRow,
        query,
        type: "Deployment",
        group: "Documentation",
        href: "/deployments",
        code: codeFromId("DEP", Number(exactRow.id)),
        label: normalize(exactRow.version),
        sublabel: [normalize(exactRow.project), normalize(exactRow.environment), normalize(exactRow.date)].filter(Boolean).join(" · "),
        snippetSource: exactRow.changelog || exactRow.notes,
        fieldScores: [
          ["version", 100],
          ["project", 72],
          ["environment", 45],
          ["developer", 32],
          ["status", 30],
          ["notes", 18],
          ["date", 18],
        ],
      });
      if (exactItem) return [exactItem];
    }
  }
  const like = `%${escapeLike(query).toLowerCase()}%`;
  const filter = buildFilterClause(filters, { statusColumn: '"status"', assigneeColumn: '"developer"', dateColumn: '"date"' });
  const rows = await queryRows<Row>(
    `SELECT id, date, version, project, environment, developer, changelog, status, notes, updatedAt
     FROM "Deployment"
     WHERE (
       LOWER(COALESCE(date, '')) LIKE ?
       OR LOWER(COALESCE(version, '')) LIKE ?
       OR LOWER(COALESCE(project, '')) LIKE ?
       OR LOWER(COALESCE(environment, '')) LIKE ?
       OR LOWER(COALESCE(developer, '')) LIKE ?
       OR LOWER(COALESCE(changelog, '')) LIKE ?
       OR LOWER(COALESCE(status, '')) LIKE ?
       OR LOWER(COALESCE(notes, '')) LIKE ?
       OR LOWER(COALESCE(CAST(id AS TEXT), '')) LIKE ?
     )
     ${companyClause + filter.clause}
     ORDER BY "updatedAt" DESC
     LIMIT 8`,
    Array(9).fill(like).concat(filter.params, companyParams),
  );

  return rows
    .map((row) =>
      buildResult({
        row,
        query,
        type: "Deployment",
        group: "Documentation",
        href: "/deployments",
        code: codeFromId("DEP", Number(row.id)),
        label: normalize(row.version),
        sublabel: [normalize(row.project), normalize(row.environment), normalize(row.date)].filter(Boolean).join(" · "),
        snippetSource: row.changelog || row.notes || row.developer,
        fieldScores: [
          ["version", 100],
          ["project", 75],
          ["environment", 55],
          ["developer", 70],
          ["changelog", 25],
          ["status", 30],
          ["notes", 22],
          ["date", 20],
        ],
      }),
    )
    .filter((item): item is SearchResult => Boolean(item));
}
