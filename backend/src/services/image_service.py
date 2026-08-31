import base64
from dataclasses import dataclass

from fastapi import UploadFile


ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}


@dataclass(frozen=True)
class EncodedImage:
    base64_data: str
    media_type: str


async def encode_image(upload: UploadFile, max_bytes: int) -> EncodedImage:
    media_type = (upload.content_type or "").lower()
    if media_type not in ALLOWED_IMAGE_TYPES:
        raise ValueError("JPEG, PNG, WebP 이미지만 업로드할 수 있습니다.")

    data = await upload.read(max_bytes + 1)
    if not data:
        raise ValueError("비어 있는 이미지 파일입니다.")
    if len(data) > max_bytes:
        raise ValueError(f"이미지 크기는 {max_bytes // (1024 * 1024)}MB 이하여야 합니다.")

    return EncodedImage(
        base64_data=base64.b64encode(data).decode("ascii"),
        media_type=media_type,
    )
