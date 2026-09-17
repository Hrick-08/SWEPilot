import asyncio
import websockets


async def test():
    run_id = "test123"

    uri = f"ws://127.0.0.1:8000/ws/logs/{run_id}"

    print("Connecting to:", uri)

    async with websockets.connect(uri) as websocket:

        print("Connected!")

        while True:
            message = await websocket.recv()
            print("RECEIVED:", message)


asyncio.run(test())