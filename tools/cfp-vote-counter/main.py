#!/usr/bin/env python3
from typing import Literal, Optional

import fire
import pandas as pd
import matplotlib.pyplot as plt

from src.query import QueryConfig, fetch_votes, Boto3Config
from src.transform import unique_over_time, count_votes, time_series_total_count


class Command:
    """CFP Vote Counter CLI"""

    def generate_csv(self, event: str, env: Literal["stg", "prd"] = "prd", span: int = 3600,
                     region: Optional[str] = None):
        """
        Generate transformed CFP vote csv

        :param event: Event Abbreviation (e.g. cndt2022)
        :param env: Environment (stg|prd)
        :param span: Seconds of span where multiple votes from the same GIP would be considered as the same one
        :param region: Region of Dynamo vote table
        """
        conf = QueryConfig(event, env)
        boto3_conf = Boto3Config(region)
        res = fetch_votes(conf, boto3_conf)
        if res["Count"] == 0:
            print("No votes found.")
            return

        df = pd.DataFrame(res["Items"])
        df = unique_over_time(df, span)
        sr = count_votes(df)
        print(sr.to_csv())

    def time_series(self, event: str, env: Literal["stg", "prd"] = "prd", span: int = 3600,
                    region: Optional[str] = None, file: str = None):
        """
        Generate transformed CFP vote csv

        :param event: Event Abbreviation (e.g. cndt2022)
        :param env: Environment (stg|prd)
        :param span: Seconds of span where multiple votes from the same GIP would be considered as the same one
        :param region: Region of Dynamo vote table
        :param file: File name of time-series graph figure
        """
        conf = QueryConfig(event, env)
        boto3_conf = Boto3Config(region)
        res = fetch_votes(conf, boto3_conf)
        if res["Count"] == 0:
            print("No votes found.")
            return

        df = pd.DataFrame(res["Items"])
        df = unique_over_time(df, span)
        df = time_series_total_count(df, span)
        print(df)
        df.plot()
        if file:
            plt.savefig(file)
        else:
            plt.show()


if __name__ == "__main__":
    fire.Fire(Command)
