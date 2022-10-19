import pandas as pd

from src.types import Col


def unique_over_time(df: pd.DataFrame, span_sec: int = 3600) -> pd.DataFrame:
    df = (
        df.assign(**{
            Col.TS_BY_HOUR: df[Col.TIMESTAMP] // (span_sec * 1000)
        })
        .drop([Col.TIMESTAMP], axis=1)
        .drop_duplicates()
        .reset_index(drop=True)
    )
    return df


def count_votes(df: pd.DataFrame) -> pd.DataFrame:
    sr = df[Col.TALK_ID].value_counts()
    sr.index.name = Col.TALK_ID
    sr.name = Col.COUNT
    new_df = pd.DataFrame(sr).reset_index(drop=False)
    return new_df.sort_values([Col.COUNT, Col.TALK_ID], ascending=[False, True]).reset_index(drop=True)


def time_series_total_count(df: pd.DataFrame, span_sec: int = 3600) -> pd.DataFrame:
    sr = df[Col.TS_BY_HOUR].value_counts()
    df = pd.DataFrame(sr)
    df.index = pd.to_datetime(df.index.astype(int) * span_sec, unit='s', utc=True).tz_convert('Asia/Tokyo')
    df = df.rename(columns={Col.TS_BY_HOUR: Col.COUNT})
    resampled = df.resample('H').agg('sum').fillna(0)
    resampled[Col.SUM] = resampled[Col.COUNT].cumsum()
    return resampled
