from common.exceptions.api_exceptions import APIException


class InvalidCredentialsError(APIException):
    status_code = 401
    default_detail = "Invalid email or password."
    default_code = "invalid_credentials"


class TokenBlacklistedError(APIException):
    status_code = 401
    default_detail = "Token has been revoked."
    default_code = "token_blacklisted"
