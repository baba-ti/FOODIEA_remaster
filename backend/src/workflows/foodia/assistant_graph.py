from functools import lru_cache

from langgraph.graph import END, START, StateGraph

from src.workflows.foodia.nodes.assistant_nodes import (
    build_assistant_context,
    format_assistant_result,
    run_recipe_agent,
)
from src.workflows.foodia.state.assistant_state import AssistantState


@lru_cache
def get_assistant_graph():
    builder = StateGraph(AssistantState)
    builder.add_node("build_context", build_assistant_context)
    builder.add_node("run_recipe_agent", run_recipe_agent)
    builder.add_node("format_result", format_assistant_result)
    builder.add_edge(START, "build_context")
    builder.add_edge("build_context", "run_recipe_agent")
    builder.add_edge("run_recipe_agent", "format_result")
    builder.add_edge("format_result", END)
    return builder.compile()
