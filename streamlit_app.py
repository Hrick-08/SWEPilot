import asyncio
import json
import os

import requests
import streamlit as st
import websockets


BACKEND_URL = os.getenv("BACKEND_URL", "http://127.0.0.1:8000")
WS_URL = BACKEND_URL.replace("http://", "ws://").replace("https://", "wss://") + "/ws/logs"

st.set_page_config(page_title="SWEPilot Live Logs", layout="wide")
st.title("🚀 SWEPilot Live Logs")
st.write(
    "Connect to the global dashboard socket and watch run_started, log, and run_finished events as GitHub issues are raised."
)

if "events" not in st.session_state:
    st.session_state.events = []

if "connected" not in st.session_state:
    st.session_state.connected = False


def append_event(event: dict) -> None:
    if not isinstance(event, dict):
        return
    message = event.get("message")
    if message is None:
        return
    st.session_state.events.insert(0, str(message))
    st.session_state.events = st.session_state.events[:200]


async def listen_global_logs() -> None:
    log_area = st.empty()
    st.session_state.connected = True
    try:
        async with websockets.connect(WS_URL) as websocket:
            st.success("🟢 Connected to global WebSocket: /ws/logs")
            while True:
                payload = await websocket.recv()
                try:
                    event = json.loads(payload)
                except json.JSONDecodeError:
                    event = {"type": "raw", "message": payload}
                append_event(event)
                log_area.code("\n".join(st.session_state.events[:25]), language="text")
    except Exception as exc:
        st.session_state.connected = False
        st.error(f"WebSocket error: {exc}")


st.subheader("Global dashboard socket")

col1, col2 = st.columns([1, 1])
with col1:
    if st.button("Connect to /ws/logs"):
        asyncio.run(listen_global_logs())

with col2:
    if st.button("Clear log window"):
        st.session_state.events.clear()
        st.session_state.connected = False

st.caption(f"Backend: {BACKEND_URL}\nGlobal socket: {WS_URL}")

st.divider()

st.subheader("Trigger a GitHub-style issue")
issue_number = st.number_input("Issue Number", min_value=1, step=1)
issue_title = st.text_input("Issue Title", value="Test issue from Streamlit")
issue_body = st.text_area("Issue Body", value="Validate live websocket logs when a GitHub issue is opened.")

if st.button("Send sample webhook"):
    payload = {
        "action": "opened",
        "issue": {
            "number": int(issue_number),
            "title": issue_title,
            "body": issue_body,
        },
        "repository": {
            "clone_url": "https://github.com/example/repo.git",
        },
    }
    try:
        response = requests.post(f"{BACKEND_URL}/webhook", json=payload, timeout=10)
        data = response.json() if response.content else {}
        if response.status_code in {200, 202}:
            st.success(f"Webhook accepted: {data}")
        else:
            st.error(f"Webhook failed ({response.status_code}): {data}")
    except requests.RequestException as exc:
        st.error(f"Could not reach FastAPI: {exc}")

st.divider()

st.subheader("Live event stream")
if st.session_state.events:
    st.code("\n".join(st.session_state.events[:25]), language="text")
else:
    st.info("No events yet. Connect to the socket and trigger a GitHub issue to see logs appear automatically.")

st.divider()

st.subheader("Optional: latest run lookup")
issue_lookup = st.number_input("Check latest run for issue", min_value=1, step=1, key="issue_lookup")
if st.button("Lookup issue run"):
    try:
        response = requests.get(f"{BACKEND_URL}/runs/{issue_lookup}", timeout=5)
        if response.status_code == 200:
            st.success(response.json())
        else:
            st.warning(f"No run found for issue #{issue_lookup}")
    except requests.RequestException as exc:
        st.error(f"Could not connect to FastAPI: {exc}")
