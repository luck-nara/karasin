import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { env } from "../lib/env";

type ChatRole = "user" | "assistant";

type ChatMessage = {
  role: ChatRole;
  content: string;
};

const apiBase = env.apiBaseUrl.replace(/\/$/, "");

async function consumeSseDeltas(
  body: ReadableStream<Uint8Array>,
  onDelta: (chunk: string) => void
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let carry = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    carry += decoder.decode(value, { stream: true });
    const parts = carry.split("\n\n");
    carry = parts.pop() ?? "";

    for (const block of parts) {
      for (const raw of block.split("\n")) {
        const line = raw.replace(/\r$/, "").trim();
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (payload === "[DONE]") return;
        try {
          const j = JSON.parse(payload) as { d?: string; error?: string };
          if (j.error) throw new Error(j.error);
          if (j.d) onDelta(j.d);
        } catch (e) {
          if (e instanceof SyntaxError) continue;
          throw e;
        }
      }
    }
  }

  if (carry.trim()) {
    for (const raw of carry.split("\n")) {
      const line = raw.replace(/\r$/, "").trim();
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (payload === "[DONE]") return;
      try {
        const j = JSON.parse(payload) as { d?: string; error?: string };
        if (j.error) throw new Error(j.error);
        if (j.d) onDelta(j.d);
      } catch (e) {
        if (e instanceof SyntaxError) continue;
        throw e;
      }
    }
  }
}

export function AssistantChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const scrollToEnd = useCallback(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToEnd();
  }, [messages, scrollToEnd]);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;

    setError(null);
    const userMsg: ChatMessage = { role: "user", content: text };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setBusy(true);

    let assistantText = "";
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const res = await fetch(`${apiBase}/api/chat/stream`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });

      if (!res.ok) {
        let msg = `ขออภัย เกิดข้อผิดพลาด (${res.status})`;
        try {
          const j = (await res.json()) as { message?: string; error?: string };
          if (j.message) msg = j.message;
          else if (j.error === "OPENAI_NOT_CONFIGURED" || j.error === "CHAT_NOT_CONFIGURED")
            msg = "ยังไม่ได้ตั้งค่า OPENAI_API_KEY บนเซิร์ฟเวอร์";
        } catch {
          /* ignore */
        }
        throw new Error(msg);
      }

      if (!res.body) throw new Error("ไม่ได้รับสตรีมจากเซิร์ฟเวอร์");

      await consumeSseDeltas(res.body, (d) => {
        assistantText += d;
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last?.role === "assistant") {
            next[next.length - 1] = { role: "assistant", content: assistantText };
          }
          return next;
        });
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "ส่งข้อความไม่สำเร็จ";
      setError(msg);
      setMessages((prev) => {
        if (prev.length === 0) return prev;
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && last.content === "") {
          return prev.slice(0, -1);
        }
        return prev;
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="assistantPage">
      <div className="assistantTop">
        <div>
          <h1 className="assistantTitle">ผู้ช่วยแนะนำที่เที่ยวกาฬสินธุ์</h1>
          <p className="muted assistantLead">
            ตอบจากข้อมูลสถานที่ในระบบ · ภาษาไทย ·{" "}
            <Link to="/places">ดูรายการสถานที่</Link>
          </p>
        </div>
      </div>

      {error ? <div className="assistantBanner">{error}</div> : null}

      <section className="assistantPanel panel" aria-label="การสนทนา">
        <div className="assistantThread" role="log" aria-live="polite" aria-relevant="additions text">
          <div className="assistantIntro muted">
            สวัสดีค่ะ/ครับ ถามได้เลยว่าอยากไปแบบไหน หรือหาสถานที่แนวใดในจังหวัดกาฬสินธุ์
            ดิฉัน/ผมจะช่วยสรุปจากข้อมูลที่มีในเว็บให้สั้นๆ อ่านง่ายค่ะ/ครับ
          </div>

          {messages.map((m, i) => {
            const isStreamingThis = busy && i === messages.length - 1 && m.role === "assistant";
            const showAssistantActions =
              m.role === "assistant" && m.content.trim().length > 0 && !isStreamingThis;

            return (
              <div
                key={`${i}-${m.role}`}
                className={`assistantMsg assistantMsg${m.role === "user" ? "User" : "Bot"}`}
              >
                {m.role === "assistant" ? (
                  <div className="assistantMsgHead">
                    <div className="assistantMsgMeta">ผู้ช่วย</div>
                    {showAssistantActions ? <AssistantMessageActions text={m.content} /> : null}
                  </div>
                ) : (
                  <div className="assistantMsgMeta">คุณ</div>
                )}
                <div className="assistantMsgBody">
                {m.content ? (
                  <AssistantMarkdown text={m.content} />
                ) : m.role === "assistant" && busy ? (
                  <span className="assistantTyping" aria-hidden>
                    <span />
                    <span />
                    <span />
                  </span>
                ) : null}
              </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>

        <div className="assistantComposer">
          <label className="assistantComposerLabel" htmlFor="assistant-input">
            พิมพ์คำถาม
          </label>
          <div className="assistantComposerRow">
            <textarea
              id="assistant-input"
              className="assistantInput"
              rows={2}
              value={input}
              disabled={busy}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              placeholder="เช่น แนะนำที่เที่ยวธรรมชาติ / มีร้านอาหารอะไรบ้าง"
              autoComplete="off"
            />
            <button type="button" className="button buttonPrimary assistantSend" disabled={busy || !input.trim()} onClick={() => void send()}>
              {busy ? "กำลังคิด…" : "ส่ง"}
            </button>
          </div>
          <p className="muted assistantHint">Enter ส่งข้อความ · Shift+Enter ขึ้นบรรทัดใหม่</p>
        </div>
      </section>
    </div>
  );
}

function AssistantMessageActions({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function copyText() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  async function shareText() {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: "ผู้ช่วยแนะนำที่เที่ยวกาฬสินธุ์",
          text,
        });
        return;
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") return;
      }
    }
    await copyText();
  }

  return (
    <div className="assistantMsgActions">
      <button type="button" className="button buttonSmall" onClick={() => void copyText()}>
        {copied ? "คัดลอกแล้ว" : "คัดลอก"}
      </button>
      <button type="button" className="button buttonSmall" onClick={() => void shareText()}>
        แชร์
      </button>
    </div>
  );
}

function stripUrlTrailingJunk(url: string): string {
  return url.replace(/[),.;:!?]+$/g, "");
}

function isSafeHttpUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/** แปลง URL ที่ขึ้นต้น http(s) เป็นลิงก์ (ไม่ทับส่วนที่อยู่ใน Markdown link แล้ว — เรียกจากข้อความที่ไม่มี md link) */
function renderPlainUrls(segment: string, keyPrefix: string): ReactNode[] {
  const re = /(https?:\/\/[^\s<>"']+)/gi;
  const out: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(segment)) !== null) {
    if (m.index > last) {
      out.push(segment.slice(last, m.index));
    }
    const raw = stripUrlTrailingJunk(m[1]);
    if (isSafeHttpUrl(raw)) {
      const display = raw.length > 52 ? `${raw.slice(0, 50)}…` : raw;
      out.push(
        <a
          key={`${keyPrefix}-u${m.index}`}
          href={raw}
          className="assistantMdLink"
          target="_blank"
          rel="noopener noreferrer"
        >
          {display}
        </a>
      );
    } else {
      out.push(m[0]);
    }
    last = m.index + m[0].length;
  }
  if (last < segment.length) {
    out.push(segment.slice(last));
  }
  return out.length > 0 ? out : [segment];
}

/** รองรับ [ข้อความ](https://...) ที่โมเดลอาจยังตอบมา + URL เปล่า */
function renderTextWithLinks(text: string, keyPrefix: string): ReactNode {
  const re = /\[([^\]]*)\]\((https?:[^)\s]+)\)/g;
  const chunks: ReactNode[] = [];
  let idx = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > idx) {
      chunks.push(...renderPlainUrls(text.slice(idx, m.index), `${keyPrefix}p${idx}`));
    }
    const href = stripUrlTrailingJunk(m[2]);
    const label = (m[1] ?? "").trim() || "แผนที่";
    if (isSafeHttpUrl(href)) {
      chunks.push(
        <a
          key={`${keyPrefix}m${m.index}`}
          href={href}
          className="assistantMdLink assistantMdLinkPill"
          target="_blank"
          rel="noopener noreferrer"
        >
          {label}
        </a>
      );
    } else {
      chunks.push(m[0]);
    }
    idx = m.index + m[0].length;
  }
  if (idx < text.length) {
    chunks.push(...renderPlainUrls(text.slice(idx), `${keyPrefix}e${idx}`));
  }
  return chunks.length === 0 ? text : <>{chunks}</>;
}

function renderLabeledUrlLine(
  line: string,
  key: string,
  label: string,
  pillClass: string,
  linkLabel: string
): ReactNode | null {
  const m = new RegExp(`^\\s*${label}:\\s*(https?:\\S+)\\s*$`, "i").exec(line.trimEnd());
  if (!m) return null;
  const href = stripUrlTrailingJunk(m[1]);
  if (!isSafeHttpUrl(href)) return null;
  return (
    <p key={key} className="assistantMdLabelRow">
      <span className="assistantMdLabel">{label}:</span>{" "}
      <a
        href={href}
        className={`assistantMdLink assistantMdLinkPill assistantMdLink${pillClass}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        {linkLabel}
      </a>
    </p>
  );
}

/** Minimal formatting: newlines + lines starting with "- " */
function AssistantMarkdown({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="assistantMd">
      {lines.map((line, i) => {
        const t = line.trimEnd();
        const labeled =
          renderLabeledUrlLine(line, `map${i}`, "แผนที่", "Maps", "เปิดแผนที่") ??
          renderLabeledUrlLine(line, `fb${i}`, "Facebook", "Fb", "Facebook") ??
          renderLabeledUrlLine(line, `ln${i}`, "LINE", "Line", "LINE");
        if (labeled) return labeled;

        const detailMatch = /^\s*รายละเอียด:\s*(.+)$/.exec(t);
        if (detailMatch) {
          return (
            <p key={i} className="assistantMdDetail">
              <span className="assistantMdLabel">รายละเอียด:</span> {detailMatch[1]}
            </p>
          );
        }

        const categoryMatch = /^\s*หมวด:\s*(.+)$/.exec(t);
        if (categoryMatch) {
          return (
            <p key={i} className="assistantMdMeta">
              <span className="assistantMdLabel">หมวด:</span> {categoryMatch[1]}
            </p>
          );
        }

        if (/^\s*-\s+/.test(line)) {
          const inner = t.replace(/^\s*-\s+/, "");
          return (
            <div key={i} className="assistantMdBullet">
              {renderTextWithLinks(inner, `b${i}`)}
            </div>
          );
        }
        if (/^\s*\d+\.\s+/.test(line)) {
          const inner = t.replace(/^\s*\d+\.\s+/, "");
          return (
            <div key={i} className="assistantMdOrdered">
              {renderTextWithLinks(inner, `n${i}`)}
            </div>
          );
        }
        if (t === "") return <br key={i} />;
        return (
          <p key={i} className="assistantMdP">
            {renderTextWithLinks(line, `l${i}`)}
          </p>
        );
      })}
    </div>
  );
}
