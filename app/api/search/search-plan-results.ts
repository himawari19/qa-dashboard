import { codeFromId } from "@/lib/utils";
import { buildFilterClause, buildResult, buildSearchSql, escapeLike, extractExactId, normalize, queryFirst, queryRows, type Row, type SearchFilters, type SearchResult } from "./search-helpers";
export async function getPlanResults(query: string, companyClause: string, companyParams: unknown[], filters: SearchFilters = {}) {
  const exactId = extractExactId(query, "PLAN");
  if (exactId !== null) {
    const exactRow = await queryFirst<Row>(
      `SELECT id, title, project, sprint, scope, status, startDate, endDate, notes, assignee, "publicToken", updatedAt
       FROM "TestPlan"
       WHERE "deletedAt" IS NULL AND id = ?${companyClause}
       ORDER BY "updatedAt" DESC
       LIMIT 1`,
      [exactId, ...companyParams],
    );
    if (exactRow) {
      const exactItem = buildResult({
        row: exactRow,
        query,
        type: "Test Plan",
        group: "Test Management",
        href: normalize(exactRow.publicToken)
          ? `/test-plans/${encodeURIComponent(normalize(exactRow.publicToken))}`
          : `/test-plans?q=${encodeURIComponent(String(exactRow.title ?? query))}`,
        code: normalize(exactRow.code) || codeFromId("PLAN", Number(exactRow.id)),
        label: normalize(exactRow.title),
        sublabel: [normalize(exactRow.project), normalize(exactRow.sprint), normalize(exactRow.status)].filter(Boolean).join(" · "),
        snippetSource: exactRow.notes,
        fieldScores: [
          ["title", 100],
          ["status", 40],
          ["assignee", 25],
          ["notes", 20],
          ["publicToken", 16],
          ["planTitle", 80],
          ["planProject", 68],
          ["testPlanId", 36],
        ],
      });
      if (exactItem) return [exactItem];
    }
  }
  const like = `%${escapeLike(query).toLowerCase()}%`;
  const filter = buildFilterClause(filters, { statusColumn: '"status"', assigneeColumn: '"assignee"', dateColumn: '"startDate"' });
  const rows = await queryRows<Row>(
    `SELECT id, title, project, sprint, status, scope, notes, "publicToken", updatedAt
     FROM "TestPlan"
     WHERE "deletedAt" IS NULL
       AND (
         LOWER(COALESCE(title, '')) LIKE ?
         OR LOWER(COALESCE("publicToken", '')) LIKE ?
         OR LOWER(COALESCE(project, '')) LIKE ?
         OR LOWER(COALESCE(sprint, '')) LIKE ?
         OR LOWER(COALESCE(status, '')) LIKE ?
         OR LOWER(COALESCE(scope, '')) LIKE ?
         OR LOWER(COALESCE(notes, '')) LIKE ?
         OR LOWER(COALESCE(CAST(id AS TEXT), '')) LIKE ?
       )
       ${companyClause + filter.clause}
     ORDER BY "updatedAt" DESC
     LIMIT 8`,
    Array(8).fill(like).concat(filter.params, companyParams),
  );

  return rows
    .map((row) =>
      buildResult({
        row,
        query,
        type: "Test Plan",
        group: "Test Management",
        href: `/test-plans/${normalize(row.publicToken)}`,
        code: normalize(row.code) || codeFromId("PLAN", Number(row.id)),
        label: normalize(row.title),
        sublabel: [normalize(row.project), normalize(row.sprint), normalize(row.status)].filter(Boolean).join(" · "),
        snippetSource: row.scope || row.notes,
        fieldScores: [
          ["title", 100],
          ["publicToken", 80],
          ["project", 70],
          ["sprint", 68],
          ["status", 35],
          ["scope", 28],
          ["notes", 20],
          ["publicToken", 16],
        ],
      }),
    )
    .filter((item): item is SearchResult => Boolean(item));
}
