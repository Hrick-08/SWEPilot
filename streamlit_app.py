import asyncio
import json

import requests
import streamlit as st
import websockets


# --------------------------------------------------
# Configuration
# --------------------------------------------------

BACKEND_URL = "http://127.0.0.1:8000"


# --------------------------------------------------
# Page
# --------------------------------------------------

st.set_page_config(
    page_title="SWEPilot Live Logs",
    layout="wide",
)

st.title("🚀 SWEPilot Live Logs")

st.write(
    "Enter a GitHub issue number. "
    "The backend will find the associated run automatically."
)


# --------------------------------------------------
# Issue number
# --------------------------------------------------

issue_number = st.number_input(
    "GitHub Issue Number",
    min_value=1,
    step=1,
)


# --------------------------------------------------
# Fetch run information
# --------------------------------------------------

if st.button("Find Run"):

    try:

        response = requests.get(
            f"{BACKEND_URL}/runs/{issue_number}",
            timeout=5,
        )

        if response.status_code == 200:

            run = response.json()

            run_id = run["run_id"]

            st.success(
                f"Run found: {run_id}"
            )

            st.session_state["run_id"] = run_id
            st.session_state["issue_number"] = issue_number

        else:

            st.error(
                f"No run found for issue #{issue_number}"
            )

    except requests.RequestException as exc:

        st.error(
            f"Could not connect to FastAPI: {exc}"
        )


# --------------------------------------------------
# Show current run
# --------------------------------------------------

if "run_id" in st.session_state:

    run_id = st.session_state["run_id"]

    st.divider()

    st.subheader(
        f"Live Logs — Issue #{issue_number}"
    )

    st.caption(
        f"Run ID: {run_id}"
    )


    # --------------------------------------------------
    # WebSocket listener
    # --------------------------------------------------

    async def receive_logs():

        uri = (
            f"ws://127.0.0.1:8000"
            f"/ws/logs/{run_id}"
        )

        try:

            async with websockets.connect(uri) as websocket:

                st.success(
                    "🟢 WebSocket connected"
                )

                log_area = st.empty()

                logs = []

                while True:

                    message = await websocket.recv()

                    try:

                        data = json.loads(message)

                        timestamp = data.get(
                            "timestamp",
                            "",
                        )

                        level = data.get(
                            "level",
                            "INFO",
                        )

                        log_message = data.get(
                            "message",
                            "",
                        )

                        logs.append(
                            f"{timestamp} | "
                            f"{level} | "
                            f"{log_message}"
                        )

                    except json.JSONDecodeError:

                        logs.append(message)

                    log_area.code(
                        "\n".join(logs),
                        language="text",
                    )

        except Exception as exc:

            st.error(
                f"WebSocket error: {exc}"
            )


    if st.button("Start Live Log Stream"):

        asyncio.run(
            receive_logs()
        )