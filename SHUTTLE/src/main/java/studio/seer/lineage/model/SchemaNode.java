package studio.seer.lineage.model;

import org.eclipse.microprofile.graphql.Description;

@Description("Aggregated schema node for L1 overview")
public record SchemaNode(
    String id,
    String name,
    int tableCount,
    int routineCount,
    int packageCount
) {}
