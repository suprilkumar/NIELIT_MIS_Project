import os
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser

LLM = ChatGroq(
    model="llama-3.3-70b-versatile",
    temperature=0,
    streaming=True,
    groq_api_key=os.getenv("GROQ_API_KEY")
)

def get_sql_chain(db):
    table_names = ", ".join(db.get_usable_table_names())
    template = f"""
    You are a sharp data analyst. Based on the schema below, write a SQL query.

    <SCHEMA>{{schema}}</SCHEMA>

    Available tables (use EXACT names): {table_names}
    Conversation History: {{chat_history}}

    RULES:
    - Write ONLY the SQL query, nothing else.
    - Do NOT wrap in backticks.
    - Use EXACT table/column names from schema.

    Question: {{question}}
    SQL Query:
    """
    prompt = ChatPromptTemplate.from_template(template)

    def get_schema(_):
        return db.get_table_info()

    return (
        RunnablePassthrough.assign(schema=get_schema)
        | prompt
        | LLM
        | StrOutputParser()
    )


def get_full_chain(db):
    sql_chain = get_sql_chain(db)

    template = """
    You are a sharp data analyst. Answer the user's question in natural language.

    <SCHEMA>{schema}</SCHEMA>
    Conversation History: {chat_history}
    SQL Query: <SQL>{query}</SQL>
    User Question: {question}
    SQL Response: {response}

    Give a clear, concise, friendly answer. Do NOT repeat the SQL query.
    """

    def run_query(query):
        try:
            return db.run(query)
        except Exception as e:
            return f"Query failed: {str(e)}"

    prompt = ChatPromptTemplate.from_template(template)

    return (
        RunnablePassthrough.assign(query=sql_chain).assign(
            schema=lambda _: db.get_table_info(),
            response=lambda var: run_query(var["query"])
        )
        | prompt
        | LLM
        | StrOutputParser()
    )