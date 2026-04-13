from langchain_community.utilities import SQLDatabase

def get_db_connection(db_type: str, **kwargs) -> SQLDatabase:
    if db_type == "postgresql":
        uri = (
            f"postgresql+psycopg2://{kwargs['username']}:{kwargs['password']}"
            f"@{kwargs['host']}:{kwargs['port']}/{kwargs['database']}"
        )
        return SQLDatabase.from_uri(uri, schema="public", sample_rows_in_table_info=2)

    elif db_type == "mysql":
        uri = (
            f"mysql+mysqlconnector://{kwargs['username']}:{kwargs['password']}"
            f"@{kwargs['host']}:{kwargs['port']}/{kwargs['database']}"
        )
        return SQLDatabase.from_uri(uri)

    elif db_type == "sqlite":
        path = kwargs['path']
        return SQLDatabase.from_uri(f"sqlite:///{path}")

    else:
        raise ValueError(f"Unsupported db_type: {db_type}")