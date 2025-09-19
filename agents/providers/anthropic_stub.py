"""Anthropic (Claude) adapter stub.

Replace the stubbed `send` implementation with real API calls.
"""
import asyncio

async def send(prompt: str, **kwargs):
    # Simulate network latency and a simple echo response
    await asyncio.sleep(0.1)
    return f"[claude-stub] {prompt}"
