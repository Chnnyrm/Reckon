import asyncio, json, os, sys
from memwal import MemWal, MemWalConfig

async def main():
    payload = json.loads(sys.stdin.read())
    text = payload["text"]
    namespace = payload["namespace"]
    cfg = MemWalConfig(
        account_id=os.environ["MEMWAL_ACCOUNT_ID"],
        key=os.environ["MEMWAL_PRIVATE_KEY"],
        server_url=os.environ.get("MEMWAL_SERVER_URL", "https://relayer.memory.walrus.xyz"),
        namespace=namespace,
    )
    client = MemWal(cfg)
    try:
        await client.remember(text, namespace=namespace)
        print(json.dumps({"ok": True}))
    except Exception as exc:
        print(json.dumps({"ok": False, "reason": type(exc).__name__, "detail": str(exc)[:200]}))
    finally:
        await client.close()

asyncio.run(main())
