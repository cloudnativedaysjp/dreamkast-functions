import pandas as pd

from src.types import Col


def unique_over_time(df: pd.DataFrame) -> pd.DataFrame:
    df = (
        df.assign(**{
            Col.TS_BY_HOUR: df[Col.TIMESTAMP] // (3600 * 1000)
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
