from decimal import Decimal
from typing import TypedDict, Optional, Final


class Col:
    TIMESTAMP: Final[str] = "timestamp"
    TS_BY_HOUR: Final[str] = "ts_by_hour"
    TALK_ID: Final[str] = "talkId"
    GLOBAL_IP: Final[str] = "globalIp"
    EVENT_NAME: Final[str] = "eventAbbr"
    COUNT: Final[str] = "count"
    SUM: Final[str] = "sum"


class VoteRecord(TypedDict):
    eventName: Optional[str]
    timestamp: Decimal
    globalIp: int
    talkId: Decimal


class DynamoResponse(TypedDict):
    Count: int
    ScannedCount: int
    Items: list[VoteRecord]

