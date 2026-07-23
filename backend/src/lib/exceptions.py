from __future__ import annotations


class AppError(Exception):
    def __init__(self, code: str, message: str, http_status: int = 400) -> None:
        self.code = code
        self.message = message
        self.http_status = http_status
        super().__init__(message)


def client_error_body(code: str, message: str) -> dict:
    return {"error": {"code": code, "message": message}}
