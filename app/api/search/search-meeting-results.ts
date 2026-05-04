import { codeFromId } from "@/lib/utils";
import { buildFilterClause, buildResult, buildSearchSql, escapeLike, extractExactId, normalize, queryFirst, queryRows, type Row, type SearchFilters, type SearchResult } from "./search-helpers";
export async function getMeetingResults(query: string, companyClause: string, companyParams: unknown[], filters: SearchFilters = {}) {
  const exactId = extractExactId(query, "MTG");
  if (exactId !== null) {
    const exactRow = await queryFirst<Row>(
      `SELECT id, date, project, title, attendees, content, actionItems, updatedAt
       FROM "MeetingNote"
       WHERE "deletedAt" IS NULL AND id = ?${companyClause}
       ORDER BY "updatedAt" DESC
       LIMIT 1`,
      [exactId, ...companyParams],
    );
    if (exactRow) {
      const exactItem = buildResult({
        row: exactRow,
        query,
        type: "Meeting Note",
        group: "Documentation",
        href: "/meeting-notes",
        code: codeFromId("MTG", Number(exactRow.id)),
        label: normalize(exactRow.title),
        sublabel: [normalize(exactRow.project), normalize(exactRow.date)].filter(Boolean).join(" · "),
        snippetSource: exactRow.actionItems || exactRow.content || exactRow.attendees,
        fieldScores: [
          ["title", 100],
          ["project", 75],
          ["attendees", 40],
          ["content", 25],
          ["actionItems", 25],
          ["date", 20],
        ],
      });
      if (exactItem) return [exactItem];
    }
  }
  const like = `%${escapeLike(query).toLowerCase()}%`;
  const filter = buildFilterClause(filters, { assigneeColumn: '"attendees"', dateColumn: '"date"' });
  const rows = await queryRows<Row>(
    `SELECT id, date, project, title, attendees, content, actionItems, updatedAt
     FROM "MeetingNote"
     WHERE "deletedAt" IS NULL
       AND (
         LOWER(COALESCE(date, '')) LIKE ?
         OR LOWER(COALESCE(project, '')) LIKE ?
         OR LOWER(COALESCE(title, '')) LIKE ?
         OR LOWER(COALESCE(attendees, '')) LIKE ?
         OR LOWER(COALESCE(content, '')) LIKE ?
         OR LOWER(COALESCE(actionItems, '')) LIKE ?
         OR LOWER(COALESCE(CAST(id AS TEXT), '')) LIKE ?
       )
       ${companyClause + filter.clause}
     ORDER BY "updatedAt" DESC
     LIMIT 8`,
    Array(7).fill(like).concat(filter.params, companyParams),
  );

  return rows
    .map((row) =>
      buildResult({
        row,
        query,
        type: "Meeting Note",
        group: "Documentation",
        href: "/meeting-notes",
        code: codeFromId("MTG", Number(row.id)),
        label: normalize(row.title),
        sublabel: [normalize(row.project), normalize(row.date)].filter(Boolean).join(" · "),
        snippetSource: row.actionItems || row.content || row.attendees,
        fieldScores: [
          ["title", 100],
          ["project", 75],
          ["attendees", 40],
          ["content", 25],
          ["actionItems", 25],
          ["date", 20],
        ],
      }),
    )
    .filter((item): item is SearchResult => Boolean(item));
}
