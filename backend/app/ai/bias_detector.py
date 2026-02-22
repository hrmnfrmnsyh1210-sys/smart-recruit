"""Bias Detection Module - Implements 4/5ths rule and bias auditing."""

from collections import defaultdict
from typing import Optional


def check_four_fifths_rule(
    group_selection_rates: dict[str, float],
) -> dict:
    """Check if selection rates comply with the 4/5ths (80%) rule.

    The 4/5ths rule states that the selection rate for any group should be
    at least 80% of the group with the highest selection rate.

    Args:
        group_selection_rates: Dict mapping group names to their selection rates (0-1).

    Returns:
        Dict with compliance status and details.
    """
    if not group_selection_rates:
        return {"compliant": True, "details": "No data to analyze."}

    max_rate = max(group_selection_rates.values())
    if max_rate == 0:
        return {"compliant": True, "details": "No selections made."}

    threshold = max_rate * 0.8
    violations = {}

    for group, rate in group_selection_rates.items():
        if rate < threshold:
            violations[group] = {
                "rate": round(rate, 4),
                "threshold": round(threshold, 4),
                "ratio": round(rate / max_rate, 4) if max_rate > 0 else 0,
            }

    compliant = len(violations) == 0

    return {
        "compliant": compliant,
        "max_rate": round(max_rate, 4),
        "threshold_80pct": round(threshold, 4),
        "violations": violations,
        "details": (
            "All groups comply with the 4/5ths rule."
            if compliant
            else f"{len(violations)} group(s) below the 80% threshold: {', '.join(violations.keys())}."
        ),
    }


def analyze_score_distribution(
    scores: list[float],
    groups: Optional[list[str]] = None,
) -> dict:
    """Analyze score distribution for potential bias indicators."""
    if not scores:
        return {"mean": 0, "std": 0, "distribution": {}}

    import statistics

    mean = statistics.mean(scores)
    std = statistics.stdev(scores) if len(scores) > 1 else 0

    # Distribution by deciles
    sorted_scores = sorted(scores)
    n = len(sorted_scores)
    percentiles = {
        "p10": sorted_scores[max(0, n // 10 - 1)],
        "p25": sorted_scores[max(0, n // 4 - 1)],
        "p50": sorted_scores[max(0, n // 2 - 1)],
        "p75": sorted_scores[max(0, 3 * n // 4 - 1)],
        "p90": sorted_scores[max(0, 9 * n // 10 - 1)],
    }

    result = {
        "mean": round(mean, 2),
        "std": round(std, 2),
        "min": round(min(scores), 2),
        "max": round(max(scores), 2),
        "count": n,
        "percentiles": percentiles,
    }

    # Group analysis if groups provided
    if groups and len(groups) == len(scores):
        group_scores = defaultdict(list)
        for score, group in zip(scores, groups):
            group_scores[group].append(score)

        result["by_group"] = {
            group: {
                "mean": round(statistics.mean(group_s), 2),
                "count": len(group_s),
                "std": round(statistics.stdev(group_s) if len(group_s) > 1 else 0, 2),
            }
            for group, group_s in group_scores.items()
        }

    return result
