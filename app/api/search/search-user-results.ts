import { codeFromId } from "@/lib/utils";
import { buildResult, buildSearchSql, escapeLike, extractExactId, normalize, queryFirst, queryRows, type Row, type SearchResult } from "./search-helpers";
export async function getUserResults(query: string, companyClause: string, companyParams: unknown[]) {
  const exactId = extractExactId(query, "USR");
  if (exactId !== null) {
    const exactRow = await queryFirst<Row>(
      `SELECT id, name, email, role, updatedAt
       FROM "User"
       WHERE id = CAST(? AS INTEGER)${companyClause}
       ORDER BY "updatedAt" DESC
       LIMIT 1`,
      [exactId, ...companyParams],
    );
    if (exactRow) {
      const exactItem = buildResult({
        row: exactRow,
        query,
        type: "User",
        group: "System Settings",
        href: "/users",
        code: codeFromId("USR", Number(exactRow.id)),
        label: normalize(exactRow.name) || normalize(exactRow.email),
        sublabel: [normalize(exactRow.email), normalize(exactRow.role)].filter(Boolean).join(" · "),
        snippetSource: exactRow.email || exactRow.role,
        fieldScores: [
          ["name", 100],
          ["email", 90],
          ["role", 50],
        ],
      });
      if (exactItem) return [exactItem];
    }
  }
  const like = `%${escapeLike(query).toLowerCase()}%`;
  const rows = await queryRows<Row>(
    `SELECT id, name, email, role, updatedAt
     FROM "User"
     WHERE (
       LOWER(COALESCE(name, '')) LIKE ?
       OR LOWER(COALESCE(email, '')) LIKE ?
       OR LOWER(COALESCE(role, '')) LIKE ?
       OR LOWER(COALESCE(CAST(id AS TEXT), '')) LIKE ?
     )
     ${companyClause}
     ORDER BY "updatedAt" DESC
     LIMIT 8`,
    Array(5).fill(like).concat(companyParams),
  );

  return rows
    .map((row) =>
      buildResult({
        row,
        query,
        type: "User",
        group: "System Settings",
        href: "/users",
        code: codeFromId("USR", Number(row.id)),
        label: normalize(row.name) || normalize(row.email),
        sublabel: [normalize(row.email), normalize(row.role)].filter(Boolean).join(" · "),
        snippetSource: row.email || row.role,
        fieldScores: [
          ["name", 100],
          ["email", 90],
          ["role", 50],
        ],
      }),
    )
    .filter((item): item is SearchResult => Boolean(item));
}
