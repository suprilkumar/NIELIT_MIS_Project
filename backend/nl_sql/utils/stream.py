import json
from django.http import StreamingHttpResponse

def stream_llm_response(chain, payload: dict):
    """
    Wraps a LangChain streaming chain into
    Server-Sent Events (SSE) for Next.js to consume
    """
    def event_stream():
        try:
            for chunk in chain.stream(payload):
                data = json.dumps({"token": chunk})
                yield f"data: {data}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
        finally:
            yield "data: [DONE]\n\n"

    return StreamingHttpResponse(
        event_stream(),
        content_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",    # important for nginx
        }
    )
