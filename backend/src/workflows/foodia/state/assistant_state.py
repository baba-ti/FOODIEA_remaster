from typing_extensions import TypedDict


class AssistantState(TypedDict, total=False):
    request: dict
    recipe_request: dict
    context_used: list[str]
    recipe_result: dict
    result: dict
