"""Run a small demo showing concurrent subagents communicating."""
import asyncio
from agents.agent_manager import AgentManager, Message
from agents.providers.anthropic_stub import send as claude_send
from agents.providers.openai_stub import send as openai_send


async def reviewer_handler(msg: Message, bus):
    print(f"[reviewer] received from {msg.sender}: {msg.content}")
    # ask the debugger to look into it
    await bus.send(Message(sender="reviewer", recipient="debugger", content="Please investigate: " + msg.content))


async def debugger_handler(msg: Message, bus):
    print(f"[debugger] received from {msg.sender}: {msg.content}")
    # consult an LLM provider (claude) for a suggested fix
    suggestion = await claude_send("Suggest a minimal fix for: " + msg.content)
    await bus.send(Message(sender="debugger", recipient="reviewer", content=suggestion))


async def writer_handler(msg: Message, bus):
    print(f"[writer] received from {msg.sender}: {msg.content}")
    # produce code using openai stub
    code = await openai_send("Implement: " + msg.content)
    await bus.send(Message(sender="writer", recipient="reviewer", content=code))


async def main():
    mgr = AgentManager()
    mgr.add_agent("reviewer", reviewer_handler)
    mgr.add_agent("debugger", debugger_handler)
    mgr.add_agent("writer", writer_handler)

    await mgr.start_all()

    # kick off a task by sending a user request to the reviewer
    await mgr.send(sender="user", recipient="reviewer", content="There is a failing test in module X: IndexError on line 42")

    # let the system run for a short while
    await asyncio.sleep(1.0)

    await mgr.stop_all()


if __name__ == "__main__":
    asyncio.run(main())
