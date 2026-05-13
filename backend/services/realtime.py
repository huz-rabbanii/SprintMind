import asyncio
import json
import uuid
from collections import defaultdict
from typing import Any

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        # board_id -> list of (user_id, websocket)
        self._rooms: dict[str, list[tuple[str, WebSocket]]] = defaultdict(list)

    async def connect(self, board_id: str, user_id: str, ws: WebSocket):
        await ws.accept()
        self._rooms[board_id].append((user_id, ws))
        await self.broadcast(board_id, {
            "type": "presence",
            "action": "join",
            "user_id": user_id,
            "online": [uid for uid, _ in self._rooms[board_id]],
        }, exclude_ws=None)

    def disconnect(self, board_id: str, user_id: str, ws: WebSocket):
        self._rooms[board_id] = [(uid, w) for uid, w in self._rooms[board_id] if w is not ws]
        if not self._rooms[board_id]:
            del self._rooms[board_id]

    async def broadcast(self, board_id: str, payload: dict[str, Any], exclude_ws: WebSocket | None = None):
        message = json.dumps(payload)
        dead: list[tuple[str, WebSocket]] = []
        for uid, ws in list(self._rooms.get(board_id, [])):
            if ws is exclude_ws:
                continue
            try:
                await ws.send_text(message)
            except Exception:
                dead.append((uid, ws))
        for pair in dead:
            try:
                self._rooms[board_id].remove(pair)
            except ValueError:
                pass

    async def send_to_user(self, user_id: str, payload: dict[str, Any]):
        message = json.dumps(payload)
        for board_rooms in self._rooms.values():
            for uid, ws in board_rooms:
                if uid == user_id:
                    try:
                        await ws.send_text(message)
                    except Exception:
                        pass


manager = ConnectionManager()
