package studio.seer.lineage.service;

import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import studio.seer.lineage.client.ArcadeGateway;
import studio.seer.lineage.model.ExploreResult;
import studio.seer.lineage.model.GraphEdge;
import studio.seer.lineage.model.GraphNode;

import java.util.*;

/**
 * L2 — explore a schema or package scope.
 *
 * Confirmed against hound DB (2026-04-04):
 *   DaliSchema:  schema_name, schema_geoid
 *   DaliTable:   table_name,  table_geoid,  schema_geoid, column_count
 *   DaliPackage: package_name, package_geoid
 *   DaliRoutine: routine_name, routine_geoid, routine_type, package_geoid
 *
 * Scope format:
 *   "schema-ODS_TRP_CDWH"  → DaliSchema.schema_name
 *   "pkg-MY_PKG"           → DaliPackage.package_name
 *   "#10:0"                → raw @rid
 */
@ApplicationScoped
public class ExploreService {

    @Inject
    ArcadeGateway arcade;

    public Uni<ExploreResult> explore(String scope) {
        ScopeRef ref = ScopeRef.parse(scope);
        return switch (ref.type()) {
            case "schema" -> exploreSchema(ref.name());
            case "pkg"    -> explorePackage(ref.name());
            default       -> exploreByRid(ref.name());
        };
    }

    // ── Schema scope ──────────────────────────────────────────────────────────

    private Uni<ExploreResult> exploreSchema(String schemaName) {
        // Tables — use projected Cypher, edge IDs computed from src+tgt+type
        String cypher = """
            MATCH (s:DaliSchema {schema_name: $schema})-[:CONTAINS_TABLE]->(t:DaliTable)
            RETURN s.@rid AS srcId, s.schema_name AS srcLabel,
                   t.@rid AS tgtId, t.table_name AS tgtLabel, t.schema_geoid AS tgtScope,
                   'DaliTable' AS tgtType, 'CONTAINS_TABLE' AS edgeType
            LIMIT 300
            UNION ALL
            MATCH (s:DaliSchema {schema_name: $schema})-[:CONTAINS_PACKAGE]->(p:DaliPackage)
            RETURN s.@rid AS srcId, s.schema_name AS srcLabel,
                   p.@rid AS tgtId, p.package_name AS tgtLabel, '' AS tgtScope,
                   'DaliPackage' AS tgtType, 'CONTAINS_PACKAGE' AS edgeType
            LIMIT 100
            UNION ALL
            MATCH (s:DaliSchema {schema_name: $schema})-[:CONTAINS_ROUTINE]->(r:DaliRoutine)
            RETURN s.@rid AS srcId, s.schema_name AS srcLabel,
                   r.@rid AS tgtId, r.routine_name AS tgtLabel, r.schema_geoid AS tgtScope,
                   'DaliRoutine' AS tgtType, 'CONTAINS_ROUTINE' AS edgeType
            LIMIT 100
            """;

        return arcade.cypher(cypher, Map.of("schema", schemaName))
            .map(rows -> buildResult(rows, schemaName, "DaliSchema"));
    }

    // ── Package scope ─────────────────────────────────────────────────────────

    private Uni<ExploreResult> explorePackage(String packageName) {
        // Routines inside the package + tables the package uses
        String cypher = """
            MATCH (p:DaliPackage {package_name: $pkg})-[:CONTAINS_ROUTINE]->(r:DaliRoutine)
            RETURN p.@rid AS srcId, p.package_name AS srcLabel,
                   r.@rid AS tgtId, r.routine_name AS tgtLabel, r.package_geoid AS tgtScope,
                   'DaliRoutine' AS tgtType, 'CONTAINS_ROUTINE' AS edgeType
            LIMIT 200
            UNION ALL
            MATCH (p:DaliPackage {package_name: $pkg})-[:ROUTINE_USES_TABLE]->(t:DaliTable)
            RETURN p.@rid AS srcId, p.package_name AS srcLabel,
                   t.@rid AS tgtId, t.table_name AS tgtLabel, t.schema_geoid AS tgtScope,
                   'DaliTable' AS tgtType, 'ROUTINE_USES_TABLE' AS edgeType
            LIMIT 100
            """;

        return arcade.cypher(cypher, Map.of("pkg", packageName))
            .map(rows -> buildResult(rows, packageName, "DaliPackage"));
    }

    // ── RID-based (generic) ───────────────────────────────────────────────────

    private Uni<ExploreResult> exploreByRid(String rid) {
        String cypher = """
            MATCH (n)-[r]->(m)
            WHERE n.@rid = $rid
            RETURN n.@rid AS srcId, coalesce(n.schema_name, n.table_name, n.package_name, n.routine_name, '') AS srcLabel,
                   m.@rid AS tgtId, coalesce(m.schema_name, m.table_name, m.package_name, m.routine_name, m.column_name, '') AS tgtLabel,
                   m.schema_geoid AS tgtScope, m.@type AS tgtType, type(r) AS edgeType
            LIMIT 300
            """;

        return arcade.cypher(cypher, Map.of("rid", rid))
            .map(rows -> buildResult(rows, rid, ""));
    }

    // ── Result builder ────────────────────────────────────────────────────────

    /**
     * Build ExploreResult from projected Cypher rows.
     * Each row has: srcId, srcLabel, tgtId, tgtLabel, tgtScope, tgtType, edgeType
     */
    static ExploreResult buildResult(
            List<Map<String, Object>> rows,
            String rootLabel,
            String rootType) {

        Map<String, GraphNode> nodesById = new LinkedHashMap<>();
        List<GraphEdge> edges = new ArrayList<>();
        String rootId = null;

        for (Map<String, Object> row : rows) {
            String srcId    = str(row, "srcId");
            String srcLabel = str(row, "srcLabel");
            String tgtId    = str(row, "tgtId");
            String tgtLabel = str(row, "tgtLabel");
            String tgtScope = str(row, "tgtScope");
            String tgtType  = str(row, "tgtType");
            String edgeType = str(row, "edgeType");

            if (rootId == null) rootId = srcId;

            nodesById.putIfAbsent(srcId, new GraphNode(srcId, rootType, srcLabel, "", Map.of()));
            nodesById.putIfAbsent(tgtId, new GraphNode(tgtId, tgtType, tgtLabel, tgtScope, Map.of()));

            String edgeId = srcId + "__" + edgeType + "__" + tgtId;
            edges.add(new GraphEdge(edgeId, srcId, tgtId, edgeType));
        }

        return new ExploreResult(new ArrayList<>(nodesById.values()), edges);
    }

    // ── toExploreResult: used by LineageService (node/edge result rows) ──────────
    //
    // Lineage Cypher queries return rows of the form:
    //   { n: <vertex>, r: <edge>, m: <vertex> }
    // where each vertex is a Map with @rid, @type, and domain properties.

    @SuppressWarnings("unchecked")
    public static ExploreResult toExploreResult(List<Map<String, Object>> rows) {
        Map<String, GraphNode> nodesById = new LinkedHashMap<>();
        List<GraphEdge> edges = new ArrayList<>();

        for (Map<String, Object> row : rows) {
            Map<String, Object> n = (Map<String, Object>) row.get("n");
            Map<String, Object> r = (Map<String, Object>) row.get("r");
            Map<String, Object> m = (Map<String, Object>) row.get("m");
            if (n == null || r == null || m == null) continue;

            String srcId    = str(n, "@rid");
            String srcType  = str(n, "@type");
            String srcLabel = nodeLabel(n);
            String tgtId    = str(m, "@rid");
            String tgtType  = str(m, "@type");
            String tgtLabel = nodeLabel(m);
            String tgtScope = str(m, "schema_geoid");
            String edgeType = str(r, "@type");
            String edgeId   = str(r, "@rid");
            if (edgeId.isBlank()) edgeId = srcId + "__" + edgeType + "__" + tgtId;

            nodesById.putIfAbsent(srcId, new GraphNode(srcId, srcType, srcLabel, "", Map.of()));
            nodesById.putIfAbsent(tgtId, new GraphNode(tgtId, tgtType, tgtLabel, tgtScope, Map.of()));
            edges.add(new GraphEdge(edgeId, srcId, tgtId, edgeType));
        }

        return new ExploreResult(new ArrayList<>(nodesById.values()), edges);
    }

    /** Best-effort human label from any vertex property map. */
    private static String nodeLabel(Map<String, Object> node) {
        for (String key : new String[]{
                "schema_name", "table_name", "package_name",
                "routine_name", "column_name", "stmt_text"}) {
            Object v = node.get(key);
            if (v != null && !v.toString().isBlank()) return v.toString();
        }
        return str(node, "@rid");
    }

    private static String str(Map<String, Object> row, String key) {
        Object v = row.get(key);
        return v != null ? v.toString() : "";
    }

    // ── Scope parser ──────────────────────────────────────────────────────────

    record ScopeRef(String type, String name) {
        static ScopeRef parse(String scope) {
            if (scope == null || scope.isBlank()) return new ScopeRef("rid", "");
            int dash = scope.indexOf('-');
            if (dash < 0) return new ScopeRef("rid", scope);
            return new ScopeRef(scope.substring(0, dash), scope.substring(dash + 1));
        }
    }
}
