import asyncio
import json
from dataclasses import dataclass, field
from typing import Any, Dict, List, Callable


@dataclass
class Message:
    sender: str
    recipient: str
    content: str


class MessageBus:
    def __init__(self):
        self.queues: Dict[str, asyncio.Queue] = {}

    def register(self, agent_name: str):
        self.queues.setdefault(agent_name, asyncio.Queue())

    async def send(self, msg: Message):
        q = self.queues.get(msg.recipient)
        if q:
            await q.put(msg)

    async def recv(self, agent_name: str, timeout: float = None) -> Message:
        q = self.queues.get(agent_name)
        if not q:
            raise RuntimeError(f"Agent {agent_name} not registered")
        try:
            if timeout:
                return await asyncio.wait_for(q.get(), timeout)
            return await q.get()
        except asyncio.TimeoutError:
            return None


class Subagent:
    def __init__(self, name: str, bus: MessageBus, handler: Callable[[Message], Any]):
        self.name = name
        self.bus = bus
        self.handler = handler
        self.bus.register(self.name)
        self._task = None

    async def start(self):
        self._task = asyncio.create_task(self._run())

    async def _run(self):
        while True:
            msg = await self.bus.recv(self.name)
            if msg is None:
                continue
            # Handler can send messages via bus
            try:
                await self.handler(msg, self.bus)
            except Exception as e:
                print(f"Error in subagent {self.name}: {e}")

    async def stop(self):
        if self._task:
            self._task.cancel()


class AgentManager:
    def __init__(self):
        self.bus = MessageBus()
        self.agents: Dict[str, Subagent] = {}

    def add_agent(self, name: str, handler: Callable[[Message, MessageBus], Any]):
        if name in self.agents:
            raise RuntimeError("Agent already exists")
        a = Subagent(name, self.bus, handler)
        self.agents[name] = a
        return a

    async def start_all(self):
        await asyncio.gather(*(a.start() for a in self.agents.values()))

    async def stop_all(self):
        await asyncio.gather(*(a.stop() for a in self.agents.values()))

    async def send(self, sender: str, recipient: str, content: str):
        await self.bus.send(Message(sender=sender, recipient=recipient, content=content))

