import fire
import pandas as pd
import os
from dataclasses import dataclass
from pprint import pprint

import boto3
from boto3.dynamodb.conditions import Key

from src.types import DynamoResponse

EVENTS = ["cndt2022"]


class Config:
    cfp_votetable: str
    event_name: str

    def __init__(self, event: str, env: str):
        if env == "prd":
            self.cfp_votetable = "voteCFP-prd-VoteTableC0BC27A7-UKB7XFRIUIX1"
        else:
            self.cfp_votetable = "voteCFP-stg-VoteTableC0BC27A7-84BXPDSTU937"

        if event not in EVENTS:
            raise ValueError(f"event not exist: name={event}")
        self.event_name = event


def generate(event: str, env: str):
    """
    Generate transformed CFP vote csv

    :param event: Event Abbreviation (e.g. cndt2022)
    :param env: Environment [stg|prd]
    """
    conf = Config(event, env)
    dynamo = boto3.resource("dynamodb")
    # TODO pagination
    res: DynamoResponse = dynamo.Table(conf.cfp_votetable).query(
        KeyConditionExpression=Key("eventName").eq(conf.event_name),
        ProjectionExpression="#timestamp, globalIp, talkId",
        ExpressionAttributeNames={"#timestamp": "timestamp"},
    )
    pprint(res)


if __name__ == "__main__":
    fire.Fire()
