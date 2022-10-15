from typing import NamedTuple

from src.query import Boto3Config


def test_Boto3Config_as_dict():
    class TestCase(NamedTuple):
        given: Boto3Config
        want: dict

    tests: list[TestCase] = [
        TestCase(Boto3Config(region_name="ap-northeast-1"), {"region_name": "ap-northeast-1"}),
        TestCase(Boto3Config(), {})
    ]
    for t in tests:
        assert t.given.as_dict() == t.want
