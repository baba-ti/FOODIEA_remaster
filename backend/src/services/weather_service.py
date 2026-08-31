import httpx


WEATHER_LABELS = {
    0: "맑음",
    1: "대체로 맑음",
    2: "부분적으로 흐림",
    3: "흐림",
    45: "안개",
    48: "서리 안개",
    51: "약한 이슬비",
    53: "이슬비",
    55: "강한 이슬비",
    61: "약한 비",
    63: "비",
    65: "강한 비",
    71: "약한 눈",
    73: "눈",
    75: "강한 눈",
    80: "약한 소나기",
    81: "소나기",
    82: "강한 소나기",
    95: "뇌우",
}


async def get_current_weather(latitude: float, longitude: float) -> str | None:
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "current": "temperature_2m,apparent_temperature,precipitation,weather_code",
        "timezone": "auto",
    }
    try:
        async with httpx.AsyncClient(timeout=6) as client:
            response = await client.get("https://api.open-meteo.com/v1/forecast", params=params)
            response.raise_for_status()
        current = response.json().get("current", {})
        temperature = current.get("temperature_2m")
        apparent = current.get("apparent_temperature")
        code = current.get("weather_code")
        if temperature is None:
            return None
        label = WEATHER_LABELS.get(code, "날씨 정보")
        return f"{label}, 기온 {temperature}°C, 체감 {apparent}°C"
    except (httpx.HTTPError, ValueError, TypeError):
        return None
