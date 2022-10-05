from pprint import pprint

import pandas as pd
from decimal import Decimal

from src.transform import unique_over_time, count_votes
from src.types import Col


def test_unique_over_time():
    given = [
        {"globalIp": "150.91.4.170", "talkId": Decimal("1509"), "timestamp": Decimal("1664719190000")},
        {"globalIp": "150.91.4.170", "talkId": Decimal("1509"), "timestamp": Decimal("1664719191000")},
        {"globalIp": "150.91.4.170", "talkId": Decimal("1511"), "timestamp": Decimal("1664719192000")},
        {"globalIp": "183.180.0.8", "talkId": Decimal("1509"), "timestamp": Decimal("1664719193000")},
        {"globalIp": "150.91.4.170", "talkId": Decimal("1509"), "timestamp": Decimal("1664729192000")},
    ]
    df = pd.DataFrame(given)

    got = unique_over_time(df)
    assert len(got.index) == 4


def test_count_vote():
    given = [
        {"globalIp": "150.91.4.170", "talkId": Decimal("1509"), "ts_by_hour": Decimal("462421")},
        {"globalIp": "150.91.4.170", "talkId": Decimal("1511"), "ts_by_hour": Decimal("462421")},
        {"globalIp": "183.180.0.8", "talkId": Decimal("1509"), "ts_by_hour": Decimal("462421")},
        {"globalIp": "150.91.4.170", "talkId": Decimal("1509"), "ts_by_hour": Decimal("462424")}
    ]
    df = pd.DataFrame(given)

    got = count_votes(df)
    assert len(got) == 2
    assert _get_count(got, 1509) == 3
    assert _get_count(got, 1511) == 1


# test helper

def _get_count(df: pd.DataFrame, talk_id: int) -> int:
    return df[df[Col.TALK_ID] == Decimal(talk_id)].iloc[0].to_dict()[Col.COUNT]
