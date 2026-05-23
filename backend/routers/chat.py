from __future__ import annotations
import uuid

from fastapi import APIRouter
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel

from models.schemas import ChatRequest, ChatResponse
from services import ai_service, supabase_client

router = APIRouter(prefix="/chat", tags=["chat"])


class ExtendedChatRequest(ChatRequest):
    mood: str = "okay"   # good | okay | tired | stressed


class ReexplainRequest(BaseModel):
    concept: str
    original_explanation: str
    condition: str = "general"
    lang: str = "en"
    attempt: int = 1


class CheckAnswerRequest(BaseModel):
    question: str
    student_answer: str
    model_answer: str = ""
    hint: str = ""
    lang: str = "en"


@router.post("", response_model=ChatResponse)
async def chat(req: ExtendedChatRequest):
    history = await supabase_client.get_chat_history(req.session_id, limit=20)

    context_text = ""
    if req.context_file_id:
        record = await supabase_client.get_upload(req.context_file_id)
        if record:
            context_text = record["text_content"]

    await supabase_client.append_chat_message(req.session_id, "user", req.message)

    result = await run_in_threadpool(
        ai_service.chat_response,
        req.role.value,
        req.message,
        history,
        context_text,
        req.mood,
    )

    await supabase_client.append_chat_message(req.session_id, "assistant", result["message"])

    return ChatResponse(
        session_id=req.session_id,
        message=result["message"],
        suggestions=result.get("suggestions", []),
    )


@router.post("/reexplain")
async def reexplain(req: ReexplainRequest):
    result = await run_in_threadpool(
        ai_service.generate_reexplain,
        req.concept,
        req.original_explanation,
        req.condition,
        req.lang,
        req.attempt,
    )
    return result


@router.post("/check-answer")
async def check_answer(req: CheckAnswerRequest):
    result = await run_in_threadpool(
        ai_service.check_worksheet_answer,
        req.question,
        req.student_answer,
        req.model_answer,
        req.hint,
        req.lang,
    )
    return result


@router.get("/session/{session_id}/history")
async def get_history(session_id: str):
    history = await supabase_client.get_chat_history(session_id)
    return {"session_id": session_id, "messages": history}


@router.post("/session/new")
async def new_session():
    return {"session_id": str(uuid.uuid4())}
