package com.govguide.validation;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

/** Evaluates the constrained requirement expressions used by service content. */
public final class DependencyEvaluator {

    private DependencyEvaluator() {
    }

    public record Condition(String field, String operator, Object value) {
    }

    public record Expression(String type, Condition condition, List<Expression> children) {
        public Expression {
            children = children == null ? List.of() : List.copyOf(children);
        }

        public static Expression condition(Condition condition) {
            return new Expression("CONDITIONAL", condition, List.of());
        }

        public static Expression all(Expression... children) {
            return new Expression("ALL", null, List.of(children));
        }

        public static Expression any(Expression... children) {
            return new Expression("ANY", null, List.of(children));
        }
    }

    public static boolean evaluate(Expression expression, Map<String, ?> context) {
        if (expression == null || expression.type() == null) {
            throw new IllegalArgumentException("Requirement expression is required");
        }
        return switch (expression.type()) {
            case "ALL" -> {
                requireChildren(expression);
                yield expression.children().stream().allMatch(child -> evaluate(child, context));
            }
            case "ANY" -> {
                requireChildren(expression);
                yield expression.children().stream().anyMatch(child -> evaluate(child, context));
            }
            case "CONDITIONAL", "ROUTE_SELECTION", "PROCESS_STATE" ->
                    evaluateCondition(expression.condition(), context);
            default -> throw new IllegalArgumentException("Unsupported requirement expression type: " + expression.type());
        };
    }

    public static boolean evaluateCondition(Condition condition, Map<String, ?> context) {
        if (condition == null || condition.field() == null || condition.operator() == null) {
            throw new IllegalArgumentException("Condition field and operator are required");
        }
        if (!(condition.field().startsWith("applicant.") || condition.field().startsWith("workflow."))) {
            throw new IllegalArgumentException("Condition field must be applicant- or workflow-scoped");
        }
        if (!Set.of("EQUALS", "NOT_EQUALS", "LESS_THAN", "GREATER_THAN", "IN_SET")
                .contains(condition.operator())) {
            throw new IllegalArgumentException("Unsupported condition operator: " + condition.operator());
        }
        if (condition.value() == null) {
            throw new IllegalArgumentException("Condition value is required");
        }
        Object actual = context == null ? null : context.get(condition.field());
        Object expected = condition.value();
        if (actual == null) {
            return false;
        }
        return switch (condition.operator()) {
            case "EQUALS" -> Objects.equals(actual, expected);
            case "NOT_EQUALS" -> !Objects.equals(actual, expected);
            case "LESS_THAN" -> compare(actual, expected) < 0;
            case "GREATER_THAN" -> compare(actual, expected) > 0;
            case "IN_SET" -> expected instanceof Collection<?> values && values.contains(actual);
            default -> throw new IllegalArgumentException("Unsupported condition operator: " + condition.operator());
        };
    }

    private static int compare(Object actual, Object expected) {
        try {
            return toNumber(actual).compareTo(toNumber(expected));
        } catch (RuntimeException exception) {
            throw new IllegalArgumentException("Ordered conditions require numeric values", exception);
        }
    }

    private static void requireChildren(Expression expression) {
        if (expression.children().isEmpty()) {
            throw new IllegalArgumentException(expression.type() + " expression requires at least one child");
        }
    }

    private static BigDecimal toNumber(Object value) {
        if (value instanceof Number number) {
            return new BigDecimal(number.toString());
        }
        if (value instanceof String text && !text.isBlank()) {
            return new BigDecimal(text);
        }
        throw new IllegalArgumentException("Value is not numeric");
    }
}
