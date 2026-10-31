import asyncio, json, os, sys
from memwal import MemWal, MemWalConfig

async def main():
    payload = json.loads(sys.stdin.read())
    namespace = payload["namespace"]
    query = payload["query"]
    cfg = MemWalConfig(
        account_id=os.environ["MEMWAL_ACCOUNT_ID"],
        key=os.environ["MEMWAL_PRIVATE_KEY"],
        server_url=os.environ.get("MEMWAL_SERVER_URL", "https://relayer.memory.walrus.xyz"),
        namespace=namespace,
    )
    client = MemWal(cfg)
    try:
        result = await client.recall(query, limit=10, namespace=namespace)
        rows = getattr(result, "results", None) or getattr(result, "memories", None) or []
        out = [{"text": getattr(r, "text", "")} for r in rows]
        print(json.dumps({"ok": True, "memories": out}))
    except Exception as exc:
        print(json.dumps({"ok": False, "reason": type(exc).__name__, "detail": str(exc)[:200]}))
    finally:
        await client.close()

asyncio.run(main())
