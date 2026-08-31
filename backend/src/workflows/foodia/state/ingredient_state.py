from typing_extensions import TypedDict


class IngredientState(TypedDict, total=False):
    image_base64: str
    media_type: str
    filename: str | None
    detection: dict
    result: dict
