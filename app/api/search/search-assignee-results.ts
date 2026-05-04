import { codeFromId } from "@/lib/utils";
import { buildResult, buildSearchSql, escapeLike, extractExactId, normalize, queryFirst, queryRows, type Row, type SearchResult } from "./search-helpers";
export async function getAssigneeResults(query: string, companyClause: string, companyParams: unknown[]) {
  const exactId = extractExactId(query, "ASS");
  if (exactId !== null) {
    const exactRow = await queryFirst<Row>(
      `SELECT id, name, role, email, skills, status, updatedAt
       FROM "Assignee"
       WHERE id = CAST(? AS INTEGER)${companyClause}
       ORDER BY "updatedAt" DESC
       LIMIT 1`,
      [exactId, ...companyParams],
    );
    if (exactRow) {
      const exactItem = buildResult({
        row: exactRow,
        query,
        type: "Assignee",
        group: "System Settings",
        href: "/assignees",
        code: codeFromId("ASS", Number(exactRow.id)),
        label: normalize(exactRow.name),
        sublabel: [normalize(exactRow.role), normalize(exactRow.email), normalize(exactRow.status)].filter(Boolean).join(" · "),
        snippetSource: exactRow.skills,
        fieldScores: [
          ["name", 100],
          ["role", 65],
          ["email", 70],
          ["skills", 30],
          ["status", 25],
        ],
      });
      if (exactItem) return [exactItem];
    }
  }
  const like = `%${escapeLike(query).toLowerCase()}%`;
  const rows = await queryRows<Row>(
    `SELECT id, name, role, email, skills, status, updatedAt
     FROM "Assignee"
     WHERE (
       LOWER(COALESCE(name, '')) LIKE ?
       OR LOWER(COALESCE(role, '')) LIKE ?
       OR LOWER(COALESCE(email, '')) LIKE ?
       OR LOWER(COALESCE(skills, '')) LIKE ?
       OR LOWER(COALESCE(status, '')) LIKE ?
       OR LOWER(COALESCE(CAST(id AS TEXT), '')) LIKE ?
     )
     ${companyClause}
     ORDER BY "updatedAt" DESC
     LIMIT 8`,
    Array(6).fill(like).concat(companyParams),
  );

  return rows
    .map((row) =>
      buildResult({
        row,
        query,
        type: "Assignee",
        group: "System Settings",
        href: "/assignees",
        code: codeFromId("ASS", Number(row.id)),
        label: normalize(row.name),
        sublabel: [normalize(row.role), normalize(row.email), normalize(row.status)].filter(Boolean).join(" · "),
        snippetSource: row.skills,
        fieldScores: [
          ["name", 100],
          ["role", 65],
          ["email", 70],
          ["skills", 30],
          ["status", 25],
        ],
      }),
    )
    .filter((item): item is SearchResult => Boolean(item));
}
