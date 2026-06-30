// Fire-and-forget Telegram notifications to the operator's personal chat.
// Bot: @wediditforyou_reports_bot. Chat: aljaz's private chat (id in env).
//
// Server-only — never import from a client component.

export async function notifyTelegram(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        disable_web_page_preview: true,
      }),
    });
  } catch (e) {
    console.error("[telegram] send failed:", (e as Error).message);
  }
}
