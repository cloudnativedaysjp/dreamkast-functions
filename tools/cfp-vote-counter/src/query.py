from datetime import datetime
from decimal import Decimal
from typing import Final

import boto3
from boto3.dynamodb.conditions import Key

from src.types import DynamoResponse, Col


DYNAMO_VOTE_TABLE_PRD: Final[str] = "voteCFP-prd-VoteTableC0BC27A7-UKB7XFRIUIX1"
DYNAMO_VOTE_TABLE_STG: Final[str] = "voteCFP-stg-VoteTableC0BC27A7-84BXPDSTU937"

VOTING_PERIOD: Final[dict[str, tuple[datetime, datetime]]] = {
    "cndt2022": (datetime.fromisoformat('2022-10-01'), datetime.fromisoformat('2022-10-13T18:00:00Z+09:00'))
}


class QueryConfig:
    cfp_votetable: str
    event_name: str
    voting_start: Decimal
    voting_end: Decimal

    def __init__(self, event: str, env: str):
        if env == "prd":
            self.cfp_votetable = DYNAMO_VOTE_TABLE_PRD
        elif env == "stg":
            self.cfp_votetable = DYNAMO_VOTE_TABLE_STG
        else:
            raise ValueError(f"env not exist: name={env}")

        if event not in VOTING_PERIOD:
            raise ValueError(f"event not exist: name={event}")
        self.event_name = event
        self.voting_start = Decimal(VOTING_PERIOD[event][0].timestamp() * 1000)
        self.voting_end = Decimal(VOTING_PERIOD[event][1].timestamp() * 1000)


def fetch_votes(conf: QueryConfig) -> DynamoResponse:
    dynamo = boto3.resource("dynamodb")
    res: DynamoResponse = dynamo.Table(conf.cfp_votetable).query(
        KeyConditionExpression=(
                Key(Col.EVENT_NAME).eq(conf.event_name)
                & Key(Col.TIMESTAMP).between(conf.voting_start, conf.voting_end)
        ),
        ProjectionExpression=f"#{Col.TIMESTAMP}, {Col.GLOBAL_IP}, {Col.TALK_ID}",
        ExpressionAttributeNames={f"#{Col.TIMESTAMP}": Col.TIMESTAMP},
        Limit=10000,
    )
    return res
