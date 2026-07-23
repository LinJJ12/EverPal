"""Local E2E smoke against a running backend (no secrets printed)."""
from __future__ import annotations

import json
import sys

import httpx

BASE = "http://127.0.0.1:8000"
CID = "web_verify_e2e_01"
H = {"X-Client-Id": CID, "Content-Type": "application/json"}


def check(ok_flag: list[bool], name: str, cond: bool, detail: str = "") -> None:
    if cond:
        print(f"PASS  {name}")
    else:
        ok_flag[0] = False
        print(f"FAIL  {name} {detail}")


def main() -> int:
    ok = [True]
    # trust_env=False：避免本机系统代理（如 127.0.0.1:10809）劫持 localhost 返回 503
    with httpx.Client(timeout=90.0, trust_env=False) as c:
        r = c.get(f"{BASE}/health")
        check(ok, "health", r.status_code == 200 and r.json().get("status") == "ok", r.text[:200])

        r = c.get(f"{BASE}/v1/companions")
        comps = r.json()
        check(
            ok,
            "companions_count",
            r.status_code == 200 and isinstance(comps, list) and len(comps) == 3,
            str(type(comps)),
        )
        check(ok, "companions_fields", all("id" in x and "name" in x and "blurb" in x for x in comps))

        r = c.get(f"{BASE}/v1/profile", headers=H)
        check(ok, "profile_get", r.status_code == 200 and r.json().get("client_id") == CID, r.text[:200])

        r = c.patch(
            f"{BASE}/v1/profile",
            headers=H,
            json={
                "nickname": "yan-xiao",
                "mode": "child",
                "companion_id": "nuan",
                "likes": ["drawing", "cats"],
            },
        )
        p = r.json()
        check(
            ok,
            "profile_patch",
            r.status_code == 200 and p.get("nickname") == "yan-xiao" and "drawing" in p.get("likes", []),
            r.text[:200],
        )

        session_id = None
        with c.stream(
            "POST",
            f"{BASE}/v1/chat/stream",
            headers=H,
            json={
                "message": "Say hi in one short Chinese sentence.",
                "mode": "child",
                "companion_id": "nuan",
                "nickname": "yan-xiao",
                "likes": ["drawing"],
                "client_id": CID,
                "persist": True,
            },
        ) as resp:
            check(ok, "chat_http", resp.status_code == 200, f"status={resp.status_code}")
            buf = "".join(resp.iter_text())
            event = "message"
            deltas: list[str] = []
            events: list[str] = []
            has_done = False
            has_error = False
            err_msg = ""
            for line in buf.splitlines():
                if line.startswith("event:"):
                    event = line[6:].strip()
                elif line.startswith("data:"):
                    raw = line[5:].strip()
                    if not raw:
                        continue
                    try:
                        data = json.loads(raw)
                    except json.JSONDecodeError:
                        continue
                    events.append(event)
                    if event == "meta":
                        session_id = data.get("session_id") or session_id
                    elif event == "delta" and isinstance(data.get("text"), str):
                        deltas.append(data["text"])
                    elif event == "done":
                        has_done = True
                        session_id = data.get("session_id") or session_id
                    elif event == "error":
                        has_error = True
                        err_msg = str(data.get("message") or data)
                    event = "message"
            joined = "".join(deltas)
            check(ok, "chat_has_delta", len(joined) > 0, f"events={events} err={err_msg}")
            check(ok, "chat_done", has_done and not has_error, err_msg or f"events={events}")
            check(ok, "chat_session", bool(session_id), f"session_id={session_id}")
            print(f"INFO  reply_len={len(joined)} session={session_id}")

        r = c.get(f"{BASE}/v1/sessions", headers=H)
        sessions = r.json().get("sessions") or []
        check(ok, "sessions_list", r.status_code == 200 and len(sessions) >= 1, r.text[:200])

        if session_id:
            r = c.get(f"{BASE}/v1/sessions/{session_id}", headers=H)
            msgs = (r.json().get("messages") or [])
            check(ok, "session_detail", r.status_code == 200 and len(msgs) >= 2, f"msg_count={len(msgs)}")

            # frontend-like second turn with history
            hist = [{"role": m["role"], "content": m["content"]} for m in msgs if m.get("role") in ("user", "assistant")]
            with c.stream(
                "POST",
                f"{BASE}/v1/chat/stream",
                headers=H,
                json={
                    "message": "再回一句短的",
                    "mode": "child",
                    "companion_id": "nuan",
                    "client_id": CID,
                    "session_id": session_id,
                    "history": hist[-6:],
                    "persist": True,
                },
            ) as resp2:
                buf2 = "".join(resp2.iter_text())
                check(ok, "chat_turn2_http", resp2.status_code == 200)
                check(ok, "chat_turn2_delta", "event: delta" in buf2 or '"text"' in buf2, buf2[:120])

    print("RESULT", "OK" if ok[0] else "FAILED")
    return 0 if ok[0] else 1


if __name__ == "__main__":
    raise SystemExit(main())
