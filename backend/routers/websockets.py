
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from jose import JWTError

from services.realtime import manager
from services.auth import decode_token

router = APIRouter(tags=["websockets"])


@router.websocket("/ws/board/{board_id}")
async def board_ws(board_id: str, websocket: WebSocket, token: str = ""):
    """
    WebSocket endpoint for real-time board collaboration.
    Connect: ws://localhost:8000/ws/board/<board-id>?token=<jwt>
    """
    user_id = "anonymous"
    if token:
        try:
            payload = decode_token(token)
            user_id = payload.get("sub", "anonymous")
        except (JWTError, Exception):
            await websocket.close(code=4001)
            return

    await manager.connect(board_id, user_id, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            event_type = data.get("type", "")

            if event_type == "typing":
                await manager.broadcast(board_id, {
                    "type": "typing",
                    "user_id": user_id,
                    "task_id": data.get("task_id"),
                }, exclude_ws=websocket)

            elif event_type == "cursor":
                await manager.broadcast(board_id, {
                    "type": "cursor",
                    "user_id": user_id,
                    "x": data.get("x"),
                    "y": data.get("y"),
                }, exclude_ws=websocket)

            elif event_type == "ping":
                await websocket.send_json({"type": "pong"})

    except WebSocketDisconnect:
        manager.disconnect(board_id, user_id, websocket)
        await manager.broadcast(board_id, {
            "type": "presence",
            "action": "leave",
            "user_id": user_id,
        })
