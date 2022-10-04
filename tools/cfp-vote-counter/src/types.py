from decimal import Decimal
from typing import TypedDict, Optional


class VoteRecord(TypedDict):
    eventName: Optional[str]
    timestamp: Decimal
    globalIp: int
    talkId: Decimal


class DynamoResponse(TypedDict):
    Count: int
    ScannedCount: int
    Items: list[VoteRecord]

