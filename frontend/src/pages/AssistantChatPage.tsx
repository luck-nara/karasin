import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { placesApi } from "../api/places";
import { env } from "../lib/env";
import type { PlaceListItem } from "../types";

type ChatRole = "user" | "assistant";

type ChatMessage = {
  role: ChatRole;
  content: string;
};

const apiBase = env.apiBaseUrl.replace(/\/$/, "");

const PLACE_FALLBACK_IMG =
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80";

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
  const [places, setPlaces] = useState<PlaceListItem[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  const scrollToEnd = useCallback(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await placesApi.list();
        if (alive) setPlaces(data);
      } catch {
        /* แชทยังใช้ได้ แต่จะไม่เติมลิงก์จากฐานข้อมูลอัตโนมัติ */
      }
    })();
    return () => {
      alive = false;
    };
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
                  <AssistantMarkdown text={m.content} places={places} />
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

const ASSISTANT_SHARE_TITLE = "ผู้ช่วยแนะนำที่เที่ยวกาฬสินธุ์";

function assistantSharePageUrl(): string {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/assistant`;
}

function buildAssistantShareText(text: string): string {
  const pageUrl = assistantSharePageUrl();
  const body = text.trim();
  if (!pageUrl) return body;
  return `${body}\n\n— ${ASSISTANT_SHARE_TITLE}\n${pageUrl}`;
}

function AssistantMessageActions({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const shareText = buildAssistantShareText(text);

  async function copyText() {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  async function shareNative() {
    if (typeof navigator.share !== "function") return;
    try {
      await navigator.share({
        title: ASSISTANT_SHARE_TITLE,
        text: shareText,
        url: assistantSharePageUrl(),
      });
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return;
    }
  }

  const canNativeShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  return (
    <div className="assistantMsgActions">
      <button type="button" className="button buttonSmall" onClick={() => void copyText()}>
        {copied ? "คัดลอกแล้ว" : "คัดลอก"}
      </button>
      {canNativeShare ? (
        <button type="button" className="button buttonSmall" onClick={() => void shareNative()}>
          แชร์
        </button>
      ) : null}
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

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractFirstUrl(text: string): string | null {
  const md = /\[([^\]]*)\]\((https?:[^)\s]+)\)/i.exec(text);
  if (md) {
    const href = stripUrlTrailingJunk(md[2]);
    if (isSafeHttpUrl(href)) return href;
  }
  const m = /(https?:\/\/[^\s<>"')\]]+)/i.exec(text);
  if (!m) return null;
  const href = stripUrlTrailingJunk(m[1]);
  return isSafeHttpUrl(href) ? href : null;
}

function formatUrlDisplay(url: string, max = 56): string {
  if (url.length <= max) return url;
  return `${url.slice(0, max - 1)}…`;
}

function linkClassFromHref(href: string): "Maps" | "Fb" | "Line" | "" {
  try {
    const host = new URL(href).hostname.toLowerCase();
    if (host.includes("facebook") || host.includes("fb.com") || host === "fb.me") return "Fb";
    if (host.includes("line.me") || host.includes("lin.ee")) return "Line";
    if (
      host.includes("google") ||
      host.includes("goo.gl") ||
      host.includes("maps.app") ||
      host.includes("maps.google")
    ) {
      return "Maps";
    }
  } catch {
    /* ignore */
  }
  return "";
}

const LABELED_URL_GROUPS = [
  { keys: ["แผนที่", "google maps", "google map", "maps"], label: "แผนที่", linkClass: "Maps" as const },
  { keys: ["facebook", "fb", "เฟซบุ๊ก", "เฟสบุ๊ก", "เฟส"], label: "Facebook", linkClass: "Fb" as const },
  { keys: ["line", "ไลน์", "line official"], label: "LINE", linkClass: "Line" as const },
];

function normalizeMdLine(line: string): string {
  return line.trim().replace(/\*\*/g, "");
}

function parseLabeledUrlLine(line: string): { label: string; href: string; linkClass: string } | null {
  const trimmed = normalizeMdLine(line);
  if (!trimmed) return null;

  for (const group of LABELED_URL_GROUPS) {
    for (const key of group.keys) {
      const re = new RegExp(`^${escapeRegExp(key)}\\s*[:：]\\s*(.+)$`, "i");
      const m = re.exec(trimmed);
      if (!m) continue;
      const href = extractFirstUrl(m[1]);
      if (href) return { label: group.label, href, linkClass: group.linkClass };
    }
  }

  const href = extractFirstUrl(trimmed);
  if (href) {
    const byHost = linkClassFromHref(href);
    if (byHost === "Fb") return { label: "Facebook", href, linkClass: "Fb" };
    if (byHost === "Line") return { label: "LINE", href, linkClass: "Line" };
    if (byHost === "Maps") return { label: "แผนที่", href, linkClass: "Maps" };
  }

  for (const group of LABELED_URL_GROUPS) {
    if (group.linkClass === "Line" && !/\bline\b/i.test(trimmed) && !/ไลน์/i.test(trimmed)) continue;
    for (const key of group.keys) {
      if (key.length <= 3 && group.linkClass === "Fb") {
        if (!new RegExp(`\\b${escapeRegExp(key)}\\b`, "i").test(trimmed)) continue;
      } else if (!new RegExp(escapeRegExp(key), "i").test(trimmed)) {
        continue;
      }
      const found = extractFirstUrl(trimmed);
      if (found && linkClassFromHref(found) === group.linkClass) {
        return { label: group.label, href: found, linkClass: group.linkClass };
      }
    }
  }

  return null;
}

function renderUrlWithCopy(href: string, key: string, linkClass: string, copyLabel: string): ReactNode {
  return (
    <span key={key} className="assistantUrlRow">
      <a
        href={href}
        className={`assistantMdLink assistantMdLinkUrl${linkClass ? ` assistantMdLink${linkClass}` : ""}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        {formatUrlDisplay(href)}
      </a>
      <CopyLinkButton url={href} label={copyLabel} />
    </span>
  );
}

/** แปลง URL ที่ขึ้นต้น http(s) เป็นลิงก์ + ปุ่มคัดลอกสำหรับโซเชียล/แผนที่ */
function renderPlainUrls(segment: string, keyPrefix: string): ReactNode[] {
  const re = /(https?:\/\/[^\s<>"')\]]+)/gi;
  const out: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(segment)) !== null) {
    if (m.index > last) {
      out.push(segment.slice(last, m.index));
    }
    const raw = stripUrlTrailingJunk(m[1]);
    if (isSafeHttpUrl(raw)) {
      const kind = linkClassFromHref(raw);
      if (kind) {
        const label = kind === "Fb" ? "Facebook" : kind === "Line" ? "LINE" : "แผนที่";
        out.push(renderUrlWithCopy(raw, `${keyPrefix}-u${m.index}`, kind, label));
      } else {
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
      }
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
    const mdLabel = (m[1] ?? "").trim();
    if (isSafeHttpUrl(href)) {
      const kind = linkClassFromHref(href);
      const parsed = parseLabeledUrlLine(`${mdLabel}: ${href}`);
      if (kind || parsed) {
        const linkClass = parsed?.linkClass ?? kind ?? "";
        const displayLabel = parsed?.label ?? (mdLabel || "ลิงก์");
        chunks.push(
          <span key={`${keyPrefix}m${m.index}`} className="assistantMdMdLinkWrap">
            {mdLabel ? <span className="assistantMdLabel">{displayLabel}: </span> : null}
            {renderUrlWithCopy(href, `${keyPrefix}mc${m.index}`, linkClass, displayLabel)}
          </span>
        );
      } else {
        chunks.push(
          <a
            key={`${keyPrefix}m${m.index}`}
            href={href}
            className="assistantMdLink assistantMdLinkPill"
            target="_blank"
            rel="noopener noreferrer"
          >
            {mdLabel || formatUrlDisplay(href)}
          </a>
        );
      }
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

function CopyLinkIcon({ copied }: { copied: boolean }) {
  if (copied) {
    return (
      <svg viewBox="0 0 24 24" width={16} height={16} aria-hidden focusable="false">
        <path
          fill="currentColor"
          d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" width={16} height={16} aria-hidden focusable="false">
      <path
        fill="currentColor"
        d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"
      />
    </svg>
  );
}

function CopyLinkButton({ url, label }: { url: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <button
      type="button"
      className={`assistantCopyBtn${copied ? " isCopied" : ""}`}
      onClick={() => void copy()}
      aria-label={copied ? "คัดลอกลิงก์แล้ว" : `คัดลอกลิงก์ ${label}`}
      title={copied ? "คัดลอกแล้ว" : "คัดลอกลิงก์"}
    >
      <CopyLinkIcon copied={copied} />
    </button>
  );
}

function AssistantUrlRow({
  label,
  href,
  linkClass,
  rowKey,
}: {
  label: string;
  href: string;
  linkClass: string;
  rowKey: string;
}) {
  return (
    <div key={rowKey} className="assistantMdLabelRow assistantUrlBlock">
      <div className="assistantUrlLine">
        <span className="assistantMdLabel">{label}:</span>
        {renderUrlWithCopy(href, `${rowKey}-link`, linkClass, label)}
      </div>
    </div>
  );
}

type AssistantBlock =
  | { kind: "place"; title: string; lines: string[] }
  | { kind: "text"; lines: string[] };

function splitAssistantBlocks(text: string): AssistantBlock[] {
  const lines = text.split("\n");
  const blocks: AssistantBlock[] = [];
  let placeBlock: { title: string; lines: string[] } | null = null;
  let textLines: string[] = [];

  function flushText() {
    if (textLines.length > 0) {
      blocks.push({ kind: "text", lines: textLines });
      textLines = [];
    }
  }

  function flushPlace() {
    if (placeBlock) {
      blocks.push({ kind: "place", title: placeBlock.title, lines: placeBlock.lines });
      placeBlock = null;
    }
  }

  for (const line of lines) {
    const topBullet = /^-\s+(.+)$/.exec(line);
    const topOrdered = /^\d+\.\s+(.+)$/.exec(line);

    if (topBullet) {
      flushText();
      flushPlace();
      placeBlock = { title: topBullet[1].trim(), lines: [] };
    } else if (topOrdered) {
      flushText();
      flushPlace();
      placeBlock = { title: topOrdered[1].trim(), lines: [] };
    } else if (placeBlock) {
      placeBlock.lines.push(line);
    } else {
      textLines.push(line);
    }
  }

  flushPlace();
  flushText();
  return blocks;
}

function normalizePlaceName(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[（(].*?[）)]/g, "")
    .trim();
}

function matchPlaceByTitle(title: string, places: PlaceListItem[]): PlaceListItem | null {
  const t = normalizePlaceName(title);
  if (!t) return null;
  const exact = places.find((p) => normalizePlaceName(p.name) === t);
  if (exact) return exact;
  const partial = places.filter((p) => {
    const n = normalizePlaceName(p.name);
    return t.includes(n) || n.includes(t);
  });
  if (partial.length === 1) return partial[0];
  return partial.sort((a, b) => a.name.length - b.name.length)[0] ?? null;
}

function blockTextHasUrl(blockText: string, url: string | null): boolean {
  if (!url) return true;
  return blockText.includes(url);
}

function blockTextHasSocial(blockText: string, kind: "Maps" | "Fb" | "Line"): boolean {
  if (kind === "Fb" && /facebook\.com|fb\.com|fb\.me/i.test(blockText)) return true;
  if (kind === "Line" && /line\.me|lin\.ee/i.test(blockText)) return true;
  if (kind === "Maps" && /google\.com\/maps|maps\.app|goo\.gl/i.test(blockText)) return true;
  return false;
}

function AssistantPlaceCover({ place, rowKey }: { place: PlaceListItem; rowKey: string }) {
  const img = place.coverImageUrl ?? PLACE_FALLBACK_IMG;
  return (
    <Link
      key={rowKey}
      to={`/places/${place.id}`}
      className="assistantPlaceCoverLink"
      aria-label={`ดูรายละเอียด ${place.name}`}
    >
      <div className="assistantPlaceCoverWrap">
        <img className="assistantPlaceCoverImg" src={img} alt={place.name} loading="lazy" />
        {place.categoryName ? <span className="assistantPlaceCoverBadge">{place.categoryName}</span> : null}
      </div>
    </Link>
  );
}

function renderPlaceLinksFromDb(
  place: PlaceListItem,
  blockText: string,
  keyPrefix: string
): ReactNode[] {
  const rows: ReactNode[] = [];
  if (
    place.googleMapsUrl &&
    !blockTextHasUrl(blockText, place.googleMapsUrl) &&
    !blockTextHasSocial(blockText, "Maps")
  ) {
    rows.push(
      <AssistantUrlRow
        key={`${keyPrefix}gm`}
        rowKey={`${keyPrefix}gm`}
        label="แผนที่"
        href={place.googleMapsUrl}
        linkClass="Maps"
      />
    );
  }
  if (
    place.facebookUrl &&
    !blockTextHasUrl(blockText, place.facebookUrl) &&
    !blockTextHasSocial(blockText, "Fb")
  ) {
    rows.push(
      <AssistantUrlRow
        key={`${keyPrefix}fb`}
        rowKey={`${keyPrefix}fb`}
        label="Facebook"
        href={place.facebookUrl}
        linkClass="Fb"
      />
    );
  }
  if (
    place.lineUrl &&
    !blockTextHasUrl(blockText, place.lineUrl) &&
    !blockTextHasSocial(blockText, "Line")
  ) {
    rows.push(
      <AssistantUrlRow
        key={`${keyPrefix}ln`}
        rowKey={`${keyPrefix}ln`}
        label="LINE"
        href={place.lineUrl}
        linkClass="Line"
      />
    );
  }
  return rows;
}

function renderAssistantLine(line: string, lineKey: string): ReactNode {
  const t = line.trimEnd();
  const parsedUrl = parseLabeledUrlLine(line);
  if (parsedUrl) {
    return (
      <AssistantUrlRow
        key={lineKey}
        rowKey={lineKey}
        label={parsedUrl.label}
        href={parsedUrl.href}
        linkClass={parsedUrl.linkClass}
      />
    );
  }

  const detailMatch = /^\s*รายละเอียด:\s*(.+)$/.exec(normalizeMdLine(t));
  if (detailMatch) {
    return (
      <p key={lineKey} className="assistantMdDetail">
        <span className="assistantMdLabel">รายละเอียด:</span>{" "}
        {renderTextWithLinks(detailMatch[1], `${lineKey}d`)}
      </p>
    );
  }

  const categoryMatch = /^\s*หมวด:\s*(.+)$/.exec(normalizeMdLine(t));
  if (categoryMatch) {
    return (
      <p key={lineKey} className="assistantMdMeta">
        <span className="assistantMdLabel">หมวด:</span> {categoryMatch[1]}
      </p>
    );
  }

  if (/^\s*-\s+/.test(line)) {
    const inner = t.replace(/^\s*-\s+/, "");
    return (
      <div key={lineKey} className="assistantMdBullet">
        {renderTextWithLinks(inner, `b${lineKey}`)}
      </div>
    );
  }

  if (/^\s*\d+\.\s+/.test(line)) {
    const inner = t.replace(/^\s*\d+\.\s+/, "");
    return (
      <div key={lineKey} className="assistantMdOrdered">
        {renderTextWithLinks(inner, `n${lineKey}`)}
      </div>
    );
  }

  if (t === "") return <br key={lineKey} />;

  return (
    <p key={lineKey} className="assistantMdP">
      {renderTextWithLinks(line, `l${lineKey}`)}
    </p>
  );
}

/** จัดรูปแบบข้อความ + เติมลิงก์ Facebook/LINE/แผนที่จากฐานข้อมูล */
function AssistantMarkdown({ text, places }: { text: string; places: PlaceListItem[] }) {
  const blocks = splitAssistantBlocks(text);

  return (
    <div className="assistantMd">
      {blocks.map((block, bi) => {
        if (block.kind === "text") {
          return block.lines.map((line, li) => renderAssistantLine(line, `t${bi}-${li}`));
        }

        const blockText = [block.title, ...block.lines].join("\n");
        const matched = matchPlaceByTitle(block.title, places);
        const dbLinks = matched ? renderPlaceLinksFromDb(matched, blockText, `p${bi}`) : [];

        return (
          <div key={`place${bi}`} className="assistantPlaceBlock">
            {matched ? <AssistantPlaceCover place={matched} rowKey={`p${bi}-img`} /> : null}
            {renderAssistantLine(`- ${block.title}`, `p${bi}-title`)}
            {block.lines.map((line, li) => renderAssistantLine(line, `p${bi}-${li}`))}
            {dbLinks.length > 0 ? (
              <div className="assistantPlaceDbLinks">{dbLinks}</div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
