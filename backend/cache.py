import time
import threading
from typing import Any, Optional, Dict, Tuple


class SimpleMemoryCache:
    def __init__(self, default_ttl: int = 1800):
        self._cache: Dict[str, Tuple[float, Any]] = {}
        self._lock = threading.Lock()
        self._default_ttl = default_ttl

    def get(self, key: str) -> Optional[Any]:
        with self._lock:
            item = self._cache.get(key)
            if item is None:
                return None
            expire_at, value = item
            if time.time() > expire_at:
                try:
                    del self._cache[key]
                except KeyError:
                    pass
                return None
            return value

    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        duration = ttl if ttl is not None else self._default_ttl
        with self._lock:
            self._cache[key] = (time.time() + duration, value)

    def clear(self) -> None:
        with self._lock:
            self._cache.clear()


cache = SimpleMemoryCache(default_ttl=1800)

