"""Bridge between the xpyb desktop app and a local IPython kernel.

Requests arrive on stdin and replies leave on stdout, one JSON object per line.
Requests: {"id": str, "command": "execute"|"interrupt"|"restart"|"shutdown", "code": str}
Replies:  {"type": "ready"} once, then {"type": "result", "id", "status", ...}.
"""

import base64
import json
import os
import queue
import re
import shutil
import signal
import subprocess
import sys
import tempfile
import threading

# Imported at the top so a missing package raises the standard ModuleNotFoundError.
import ipykernel  # noqa: F401
from jupyter_client import KernelManager
from jupyter_client.kernelspec import KernelSpec, KernelSpecManager

ANSI_PATTERN = re.compile(r"\x1b\[[0-9;?]*[A-Za-z]")
STREAM_LIMIT = 1_000_000
START_TIMEOUT = 60
POLL_SECONDS = 0.1
IPC_PATH_LIMIT = 80


class CurrentInterpreterSpecs(KernelSpecManager):
    """Runs the kernel with this interpreter, ignoring installed kernel specs."""

    def get_kernel_spec(self, kernel_name):
        argv = [sys.executable, "-m", "ipykernel_launcher", "-f", "{connection_file}"]
        return KernelSpec(argv=argv, display_name="xpyb", language="python")


class Kernel:
    """Owns one kernel process and its client channels."""

    def __init__(self):
        self.manager = None
        self.client = None
        self.directory = None

    def start(self):
        self.directory = tempfile.mkdtemp(prefix="xpyb-")
        self.manager = create_manager(self.directory)
        self.manager.start_kernel(stdout=subprocess.DEVNULL, stderr=sys.stderr)
        self.client = self.manager.client()
        self.client.start_channels()
        self.client.wait_for_ready(timeout=START_TIMEOUT)

    def stop(self):
        if self.client:
            self.client.stop_channels()
        if self.manager and self.manager.has_kernel:
            self.manager.shutdown_kernel(now=True)
        if self.directory:
            shutil.rmtree(self.directory, ignore_errors=True)
        self.manager = self.client = self.directory = None

    def interrupt(self):
        if self.manager and self.manager.has_kernel:
            self.manager.interrupt_kernel()


def create_manager(directory):
    """Prefers Unix sockets so that no TCP port is opened where the OS allows it."""
    manager = KernelManager(kernel_spec_manager=CurrentInterpreterSpecs())
    manager.connection_file = os.path.join(directory, "k.json")
    if os.name != "nt" and len(directory) < IPC_PATH_LIMIT:
        manager.transport = "ipc"
        manager.ip = os.path.join(directory, "ipc")
    return manager


def stream_output(outputs, content):
    """Appends stream text, merging neighbours and capping the total size."""
    used = sum(len(item["text"]) for item in outputs if item["type"] in ("stdout", "stderr"))
    text = content["text"][: max(STREAM_LIMIT - used, 0)]
    if not text:
        return
    if outputs and outputs[-1]["type"] == content["name"]:
        outputs[-1]["text"] += text
    else:
        outputs.append({"type": content["name"], "text": text})


def rich_output(data):
    """Picks the richest supported representation of a display bundle."""
    if "image/png" in data:
        return {"type": "image", "mime": "image/png", "data": data["image/png"].strip()}
    if "image/svg+xml" in data:
        encoded = base64.b64encode(data["image/svg+xml"].encode("utf-8")).decode("ascii")
        return {"type": "image", "mime": "image/svg+xml", "data": encoded}
    if "text/html" in data:
        return {"type": "html", "html": data["text/html"], "text": data.get("text/plain", "")}
    if "text/plain" in data:
        return {"type": "stdout", "text": data["text/plain"] + "\n"}
    return None


def traceback_output(content):
    text = ANSI_PATTERN.sub("", "\n".join(content.get("traceback", [])))
    return {
        "type": "traceback",
        "ename": content.get("ename", "Error"),
        "evalue": content.get("evalue", ""),
        "text": text,
    }


def collect_output(outputs, message):
    """Folds one iopub message into the output list."""
    kind, content = message["msg_type"], message["content"]
    if kind == "stream":
        stream_output(outputs, content)
    elif kind in ("execute_result", "display_data"):
        output = rich_output(content["data"])
        if output:
            outputs.append(output)
    elif kind == "error":
        outputs.append(traceback_output(content))
    elif kind == "clear_output":
        outputs.clear()


def next_message(get_message, msg_id):
    """Returns the next reply to msg_id, or None when nothing relevant arrived."""
    try:
        message = get_message(timeout=POLL_SECONDS)
    except queue.Empty:
        return None
    return message if message["parent_header"].get("msg_id") == msg_id else None


def await_idle(kernel, msg_id, outputs, abort):
    """Collects outputs until the kernel is idle, aborted or dead."""
    while not abort.is_set():
        message = next_message(kernel.client.get_iopub_msg, msg_id)
        if message is None:
            if not kernel.manager.is_alive():
                return "died"
        elif message["msg_type"] == "status":
            if message["content"]["execution_state"] == "idle":
                return "idle"
        else:
            collect_output(outputs, message)
    return "aborted"


def await_reply(kernel, msg_id, abort):
    while not abort.is_set() and kernel.manager.is_alive():
        message = next_message(kernel.client.get_shell_msg, msg_id)
        if message:
            return message["content"]
    return {"status": "aborted"}


def died_result(outputs):
    text = "The Python kernel died while running this cell."
    outputs.append({"type": "traceback", "ename": "KernelDied", "evalue": text, "text": text})
    return {"status": "error", "executionCount": None, "outputs": outputs, "kernelDied": True}


def execute(kernel, code, abort):
    """Runs code and returns the result payload."""
    msg_id = kernel.client.execute(code, allow_stdin=False, stop_on_error=False)
    outputs = []
    state = await_idle(kernel, msg_id, outputs, abort)
    if state == "died":
        return died_result(outputs)
    reply = await_reply(kernel, msg_id, abort) if state == "idle" else {"status": "aborted"}
    return {
        "status": reply["status"],
        "executionCount": reply.get("execution_count"),
        "outputs": outputs,
    }


class Runner:
    """Reads requests on one thread and runs them in order on the main thread."""

    def __init__(self, channel):
        self.channel = channel
        self.lock = threading.Lock()
        self.requests = queue.Queue()
        self.abort = threading.Event()
        self.kernel = Kernel()

    def emit(self, message):
        with self.lock:
            try:
                self.channel.write(json.dumps(message) + "\n")
                self.channel.flush()
            except OSError:  # The app is gone; shutdown must still run to completion.
                pass

    def reply(self, request, payload):
        self.emit({"type": "result", "id": request.get("id"), **payload})

    def cancel_pending(self):
        """Answers queued executions as aborted and keeps every other request."""
        kept = []
        while not self.requests.empty():
            try:
                request = self.requests.get_nowait()
            except queue.Empty:
                break
            if request["command"] == "execute":
                self.reply(request, {"status": "aborted", "executionCount": None, "outputs": []})
            else:
                kept.append(request)
        for request in kept:
            self.requests.put(request)

    def dispatch(self, request):
        command = request.get("command")
        if command == "execute":
            self.requests.put(request)
        elif command == "interrupt":
            self.cancel_pending()
            self.kernel.interrupt()
            self.reply(request, {"status": "ok"})
        elif command in ("restart", "shutdown"):
            self.cancel_pending()
            self.abort.set()
            self.requests.put(request)
        else:
            self.reply(request, {"status": "error", "error": f"Unknown command: {command}"})

    def handle_line(self, line):
        try:
            request = json.loads(line.decode("utf-8"))
            self.dispatch(request)
        except Exception as error:  # A bad request must not stop the reader.
            self.emit({"type": "protocol_error", "error": str(error)})

    def read_requests(self):
        """Reads stdin until it closes, which means the app is gone."""
        with open(0, "rb", closefd=False) as stream:
            for line in stream:
                self.handle_line(line)
        self.dispatch({"command": "shutdown"})

    def process(self, request):
        """Runs one queued request and returns False when the runner should exit."""
        command = request["command"]
        if command == "execute":
            result = execute(self.kernel, request.get("code", ""), self.abort)
            self.reply(request, result)
            return not result.get("kernelDied")
        if command == "restart":
            self.kernel.stop()
            self.kernel.start()
            self.abort.clear()
        self.reply(request, {"status": "ok"})
        return command != "shutdown"

    def serve(self):
        try:
            self.kernel.start()
            self.emit({"type": "ready", "python": sys.executable})
            threading.Thread(target=self.read_requests, daemon=True).start()
            while self.process(self.requests.get()):
                pass
        finally:
            self.kernel.stop()


def open_protocol_channel():
    """Reserves the real stdout for JSON lines and sends stray prints to stderr."""
    channel = os.fdopen(os.dup(1), "w", encoding="utf-8")
    os.dup2(2, 1)
    return channel


def main():
    for name in ("SIGINT", "SIGTERM", "SIGHUP"):
        if hasattr(signal, name):
            signal.signal(getattr(signal, name), lambda *_: sys.exit(0))
    Runner(open_protocol_channel()).serve()


if __name__ == "__main__":
    main()
