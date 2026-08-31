from functools import lru_cache

from langgraph.graph import END, START, StateGraph

from src.workflows.foodia.nodes.recipe_nodes import (
    build_search_query,
    format_result,
    prepare_retry,
    route_after_verification,
    verify_recipes,
    web_search,
)
from src.workflows.foodia.state.recipe_state import RecipeState


@lru_cache
def get_recipe_graph():
    builder = StateGraph(RecipeState)
    builder.add_node("build_search_query", build_search_query)
    builder.add_node("web_search", web_search)
    builder.add_node("verify_recipes", verify_recipes)
    builder.add_node("prepare_retry", prepare_retry)
    builder.add_node("format_result", format_result)

    builder.add_edge(START, "build_search_query")
    builder.add_edge("build_search_query", "web_search")
    builder.add_edge("web_search", "verify_recipes")
    builder.add_conditional_edges(
        "verify_recipes",
        route_after_verification,
        {
            "format_result": "format_result",
            "prepare_retry": "prepare_retry",
        },
    )
    builder.add_edge("prepare_retry", "build_search_query")
    builder.add_edge("format_result", END)
    return builder.compile()
