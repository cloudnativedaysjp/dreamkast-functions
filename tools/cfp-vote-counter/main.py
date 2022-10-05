#!/usr/bin/env python3
from typing import Literal, Final

import fire
import pandas as pd
import os
from dataclasses import dataclass
from pprint import pprint

import boto3
from boto3.dynamodb.conditions import Key

from src.types import DynamoResponse, Col

EVENTS: Final = ["cndt2022"]
DYNAMO_VOTE_TABLE_PRD: Final = "voteCFP-prd-VoteTableC0BC27A7-UKB7XFRIUIX1"
DYNAMO_VOTE_TABLE_STG: Final = "voteCFP-stg-VoteTableC0BC27A7-84BXPDSTU937"


class Config:
    cfp_votetable: str
    event_name: str

    def __init__(self, event: str, env: str):
        if env == "prd":
            self.cfp_votetable = DYNAMO_VOTE_TABLE_PRD
        elif env == "stg":
            self.cfp_votetable = DYNAMO_VOTE_TABLE_STG
        else:
            raise ValueError(f"event not exist: name={event}")

        if event not in EVENTS:
            raise ValueError(f"event not exist: name={event}")
        self.event_name = event


class Command:
    """CFP Vote Counter CLI"""

    def generate(self, event: str, env: str = "prd"):
        """
        Generate transformed CFP vote csv

        :param event: Event Abbreviation (e.g. cndt2022)
        :param env: Environment (stg|prd)
        """
        env: Literal["stg", "prd"]
        conf = Config(event, env)
        dynamo = boto3.resource("dynamodb")

        # TODO pagination if needed
        res: DynamoResponse = dynamo.Table(conf.cfp_votetable).query(
            KeyConditionExpression=Key(Col.EVENT_NAME).eq(conf.event_name),
            ProjectionExpression=f"#{Col.TIMESTAMP}, {Col.GLOBAL_IP}, {Col.TALK_ID}",
            ExpressionAttributeNames={f"#{Col.TIMESTAMP}": Col.TIMESTAMP},
            Limit=10000,
        )
        df = pd.DataFrame(res["Items"])
        print(df)


if __name__ == "__main__":
    fire.Fire(Command)
