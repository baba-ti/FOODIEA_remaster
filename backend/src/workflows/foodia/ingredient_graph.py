from functools import lru_cache

from langgraph.graph import END, START, StateGraph

from src.workflows.foodia.nodes.ingredient_nodes import detect_ingredients, normalize_ingredients
from src.workflows.foodia.state.ingredient_state import IngredientState


@lru_cache
def get_ingredient_graph():
    builder = StateGraph(IngredientState)
    builder.add_node("detect_ingredients", detect_ingredients)
    builder.add_node("normalize_ingredients", normalize_ingredients)
    builder.add_edge(START, "detect_ingredients")
    builder.add_edge("detect_ingredients", "normalize_ingredients")
    builder.add_edge("normalize_ingredients", END)
    return builder.compile()
