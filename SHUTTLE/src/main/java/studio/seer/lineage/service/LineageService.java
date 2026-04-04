package studio.seer.lineage.service;

import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import studio.seer.lineage.client.ArcadeGateway;
import studio.seer.lineage.model.ExploreResult;

import java.util.Map;

/**
 * L3 — column-level lineage for a specific table or column node.
 *
 * Traces: Column ← ATOM_REF_COLUMN ← DaliAtom → ATOM_REF_TABLE → Table
 * This shows exactly which atoms (SQL fragments) read from / write to each column.
 */
@ApplicationScoped
public class LineageService {

    @Inject
    ArcadeGateway arcade;

    public Uni<ExploreResult> lineage(String nodeId) {
        // nodeId is a @rid like "#10:42"
        // Walk both upstream and downstream paths from the given node
        String cypher = """
            MATCH path = (src)-[*1..4]-(dst)
            WHERE src.@rid = $nodeId
              AND (src:DaliColumn OR src:DaliTable OR src:DaliAtom)
            UNWIND relationships(path) AS r
            RETURN startNode(r) AS n, r, endNode(r) AS m
            LIMIT 200
            """;

        return arcade.cypher(cypher, Map.of("nodeId", nodeId))
            .map(ExploreService::toExploreResult);
    }

    /**
     * Upstream lineage only — "what feeds into this node?"
     */
    public Uni<ExploreResult> upstream(String nodeId) {
        String cypher = """
            MATCH path = (src)-[:ATOM_REF_COLUMN|ATOM_REF_TABLE|READS_FROM|DATA_FLOW*1..6]->(dst)
            WHERE dst.@rid = $nodeId
            UNWIND relationships(path) AS r
            RETURN startNode(r) AS n, r, endNode(r) AS m
            LIMIT 200
            """;
        return arcade.cypher(cypher, Map.of("nodeId", nodeId))
            .map(ExploreService::toExploreResult);
    }

    /**
     * Downstream lineage only — "what does this node affect?"
     */
    public Uni<ExploreResult> downstream(String nodeId) {
        String cypher = """
            MATCH path = (src)-[:ATOM_REF_COLUMN|ATOM_REF_TABLE|WRITES_TO|DATA_FLOW*1..6]->(dst)
            WHERE src.@rid = $nodeId
            UNWIND relationships(path) AS r
            RETURN startNode(r) AS n, r, endNode(r) AS m
            LIMIT 200
            """;
        return arcade.cypher(cypher, Map.of("nodeId", nodeId))
            .map(ExploreService::toExploreResult);
    }
}
