import { codeFromId } from "@/lib/utils";
import { buildFilterClause, buildResult, buildSearchSql, escapeLike, extractExactId, normalize, queryFirst, queryRows, type Row, type SearchFilters, type SearchResult } from "./search-helpers";
export async function getTaskResults(query: string, companyClause: string, companyParams: unknown[], filters: SearchFilters = {}) {
  const exactId = extractExactId(query, "TASK");
  if (exactId !== null) {
    const exactRow = await queryFirst<Row>(
      `SELECT id, title, project, relatedFeature, category, status, priority, description, updatedAt
       FROM "Task"
       WHERE id = ?${companyClause}
       ORDER BY "updatedAt" DESC
       LIMIT 1`,
      [exactId, ...companyParams],
    );
    if (exactRow) {
      const exactItem = buildResult({
        row: exactRow,
        query,
        type: "Task",
        group: "Work Items",
        href: "/tasks",
        code: codeFromId("TASK", Number(exactRow.id)),
        label: normalize(exactRow.title),
        sublabel: [normalize(exactRow.project), normalize(exactRow.status)].filter(Boolean).join(" · "),
        snippetSource: exactRow.description,
        fieldScores: [
          ["title", 100],
          ["project", 70],
          ["relatedFeature", 75],
          ["category", 40],
          ["status", 30],
          ["priority", 30],
          ["description", 25],
          ["notes", 18],
          ["assignee", 20],
        ],
      });
      if (exactItem) return [exactItem];
    }
  }
  const like = `%${escapeLike(query).toLowerCase()}%`;
  const filter = buildFilterClause(filters, { statusColumn: '"status"', assigneeColumn: '"assignee"', dateColumn: '"dueDate"' });
  const rows = await queryRows<Row>(
    `SELECT id, title, project, relatedFeature, category, status, priority, description, updatedAt
     FROM "Task"
     ${buildSearchSql(
       [
         "title",
         "project",
         "relatedFeature",
         "category",
         "status",
         "priority",
         "description",
         "notes",
         "assignee",
         "CAST(id AS TEXT)",
       ],
       companyClause + filter.clause,
     )}
     ORDER BY "updatedAt" DESC
     LIMIT 8`,
    Array(10).fill(like).concat(companyParams, filter.params),
  );

  return rows
    .map((row) =>
      buildResult({
        row,
        query,
        type: "Task",
        group: "Work Items",
        href: "/tasks",
        code: codeFromId("TASK", Number(row.id)),
        label: normalize(row.title),
        sublabel: [normalize(row.project), normalize(row.status)].filter(Boolean).join(" · "),
        snippetSource: row.description,
        fieldScores: [
          ["title", 100],
          ["project", 70],
          ["relatedFeature", 75],
          ["category", 40],
          ["status", 30],
          ["priority", 30],
          ["description", 25],
          ["notes", 18],
          ["assignee", 20],
        ],
      }),
    )
    .filter((item): item is SearchResult => Boolean(item));
}
