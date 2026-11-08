package com.govguide.validation;

import java.util.ArrayDeque;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

/** Validates bounded service-prerequisite graphs before task generation. */
public final class DependencyGraphValidator {

    public static final int DEFAULT_MAX_DEPTH = 16;

    private DependencyGraphValidator() {
    }

    public static void validate(Map<String, ? extends Collection<String>> graph) {
        validate(graph, DEFAULT_MAX_DEPTH);
    }

    public static void validate(Map<String, ? extends Collection<String>> graph, int maxDepth) {
        if (graph == null || maxDepth < 1) {
            throw new IllegalArgumentException("Dependency graph and positive maximum depth are required");
        }
        Map<String, Set<String>> normalized = new HashMap<>();
        for (Map.Entry<String, ? extends Collection<String>> entry : graph.entrySet()) {
            String source = requireCode(entry.getKey());
            Collection<String> targets = entry.getValue() == null ? Set.of() : entry.getValue();
            Set<String> targetSet = new HashSet<>();
            for (String target : targets) {
                targetSet.add(requireCode(target));
            }
            normalized.put(source, targetSet);
        }
        for (Set<String> targets : normalized.values()) {
            if (!normalized.keySet().containsAll(targets)) {
                throw new IllegalArgumentException("Dependency references an unknown service");
            }
        }
        for (String service : normalized.keySet()) {
            visit(service, normalized, new ArrayDeque<>(), new HashSet<>(), maxDepth);
        }
    }

    private static void visit(
            String service,
            Map<String, Set<String>> graph,
            ArrayDeque<String> path,
            Set<String> completed,
            int maxDepth) {
        if (path.contains(service)) {
            throw new IllegalArgumentException("Circular service dependency: " + String.join(" -> ", path) + " -> " + service);
        }
        if (path.size() >= maxDepth) {
            throw new IllegalArgumentException("Dependency chain exceeds maximum depth of " + maxDepth);
        }
        if (completed.contains(service)) {
            return;
        }
        path.addLast(service);
        for (String target : graph.getOrDefault(service, Set.of())) {
            visit(target, graph, path, completed, maxDepth);
        }
        path.removeLast();
        completed.add(service);
    }

    private static String requireCode(String code) {
        if (code == null || code.isBlank()) {
            throw new IllegalArgumentException("Dependency service code is required");
        }
        return code;
    }
}
