package studio.seer.lineage.service;

import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import studio.seer.lineage.client.ArcadeGateway;
import studio.seer.lineage.model.SearchResult;

import java.util.List;
import java.util.Map;

/**
 * Full-text search across tables, columns, and routines.
 *
 * Confirmed field names (hound DB, 2026-04-04):
 *   DaliTable:   table_name,   schema_geoid
 *   DaliColumn:  column_name,  table_geoid
 *   DaliPackage: package_name
 *   DaliRoutine: routine_name, package_geoid, schema_geoid
 */
@ApplicationScoped
public class SearchService {

    @Inject
    ArcadeGateway arcade;

    public Uni<List<SearchResult>> search(String query, int limit) {
        String like = "%" + esc(query) + "%";

        // ArcadeDB SQL UNION ALL across all node types
        String sql = String.format("""
            SELECT @rid AS rid, @type AS type, table_name   AS label, schema_geoid AS scope, 1.0 AS score FROM DaliTable   WHERE table_name   LIKE '%s' LIMIT %d
            UNION ALL
            SELECT @rid AS rid, @type AS type, column_name  AS label, table_geoid  AS scope, 0.9 AS score FROM DaliColumn  WHERE column_name  LIKE '%s' LIMIT %d
            UNION ALL
            SELECT @rid AS rid, @type AS type, package_name AS label, ''           AS scope, 0.8 AS score FROM DaliPackage WHERE package_name LIKE '%s' LIMIT %d
            UNION ALL
            SELECT @rid AS rid, @type AS type, routine_name AS label, schema_geoid AS scope, 0.7 AS score FROM DaliRoutine WHERE routine_name LIKE '%s' LIMIT %d
            """,
            like, limit, like, limit, like, limit, like, limit
        );

        return arcade.sql(sql).map(rows -> rows.stream()
            .map(SearchService::toResult)
            .sorted((a, b) -> Double.compare(b.score(), a.score()))
            .limit(limit)
            .toList()
        );
    }

    private static SearchResult toResult(Map<String, Object> row) {
        Object scoreRaw = row.get("score");
        double score = (scoreRaw instanceof Number n) ? n.doubleValue() : 0.0;
        return new SearchResult(
            str(row, "@rid"),
            str(row, "@type"),
            str(row, "label"),
            str(row, "scope"),
            score
        );
    }

    private static String str(Map<String, Object> row, String key) {
        Object v = row.get(key);
        return v != null ? v.toString() : "";
    }

    private static String esc(String input) {
        return input.replace("'", "''");
    }
}
