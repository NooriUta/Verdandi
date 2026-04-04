package studio.seer.lineage.service;

import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import studio.seer.lineage.client.ArcadeGateway;
import studio.seer.lineage.model.SearchResult;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Full-text search across tables, columns, packages, routines, schemas, databases, statements.
 *
 * ArcadeDB does not support UNION ALL — queries are issued in parallel and merged in Java.
 *
 * Schema v10 fields:
 *   DaliTable:    table_name,    schema_geoid (scope)
 *   DaliColumn:   column_name,   table_geoid  (scope)
 *   DaliPackage:  package_name,  schema_geoid (scope)
 *   DaliRoutine:  routine_name,  schema_geoid (scope)
 *   DaliSchema:   schema_name,   db_name      (scope)
 *   DaliDatabase: database_name, db_name      (scope)
 *   DaliStatement: stmt_geoid,   session_id   (scope)
 */
@ApplicationScoped
public class SearchService {

    @Inject
    ArcadeGateway arcade;

    public Uni<List<SearchResult>> search(String query, int limit) {
        String like = "%" + esc(query) + "%";
        int perType = Math.max(limit / 2, 10);  // each type may return up to perType hits

        // 7 parallel queries — ArcadeDB doesn't support UNION ALL
        Uni<List<Map<String, Object>>> tables = arcade.sql(String.format(
            "SELECT @rid AS rid, @type AS type, table_name    AS label, schema_geoid AS scope, 1.0 AS score FROM DaliTable    WHERE table_name    LIKE '%s' LIMIT %d", like, perType));
        Uni<List<Map<String, Object>>> columns = arcade.sql(String.format(
            "SELECT @rid AS rid, @type AS type, column_name   AS label, table_geoid  AS scope, 0.9 AS score FROM DaliColumn   WHERE column_name   LIKE '%s' LIMIT %d", like, perType));
        Uni<List<Map<String, Object>>> packages = arcade.sql(String.format(
            "SELECT @rid AS rid, @type AS type, package_name  AS label, schema_geoid AS scope, 0.8 AS score FROM DaliPackage  WHERE package_name  LIKE '%s' LIMIT %d", like, perType));
        Uni<List<Map<String, Object>>> routines = arcade.sql(String.format(
            "SELECT @rid AS rid, @type AS type, routine_name  AS label, schema_geoid AS scope, 0.8 AS score FROM DaliRoutine  WHERE routine_name  LIKE '%s' LIMIT %d", like, perType));
        Uni<List<Map<String, Object>>> schemas = arcade.sql(String.format(
            "SELECT @rid AS rid, @type AS type, schema_name   AS label, db_name      AS scope, 0.7 AS score FROM DaliSchema   WHERE schema_name   LIKE '%s' LIMIT %d", like, perType));
        Uni<List<Map<String, Object>>> databases = arcade.sql(String.format(
            "SELECT @rid AS rid, @type AS type, database_name AS label, db_name      AS scope, 0.7 AS score FROM DaliDatabase WHERE database_name LIKE '%s' LIMIT %d", like, perType));
        Uni<List<Map<String, Object>>> stmts = arcade.sql(String.format(
            "SELECT @rid AS rid, @type AS type, stmt_geoid    AS label, session_id   AS scope, 0.6 AS score FROM DaliStatement WHERE stmt_geoid    LIKE '%s' LIMIT %d", like, perType));

        return Uni.combine().all()
            .unis(tables, columns, packages, routines, schemas, databases, stmts)
            .with((t, c, p, r, s, d, st) -> {
                List<SearchResult> merged = new ArrayList<>();
                for (var list : List.of(t, c, p, r, s, d, st)) {
                    for (var row : list) merged.add(toResult(row));
                }
                merged.sort((a, b) -> Double.compare(b.score(), a.score()));
                return merged.subList(0, Math.min(limit, merged.size()));
            });
    }

    private static SearchResult toResult(Map<String, Object> row) {
        Object scoreRaw = row.get("score");
        double score = (scoreRaw instanceof Number n) ? n.doubleValue() : 0.0;
        return new SearchResult(
            str(row, "rid"),   // @rid aliased to "rid" in SELECT
            str(row, "type"),  // @type aliased to "type" in SELECT
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
