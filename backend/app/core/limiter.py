# backend/app/core/limiter.py
"""
Centralized slowapi Limiter instance.

Defined here (not in main.py) so that endpoint modules can import it
without circular imports. main.py attaches it to app.state.

Storage: in-memory (resets on restart). Redis will be introduced in a future
update for multi-instance Render deployments.
"""
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
