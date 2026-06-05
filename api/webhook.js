const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const N8N_CM_ASSIGN_ACC  = process.env.N8N_CM_ASSIGN_ACC;
const N8N_CM_REFRESH_ACC = process.env.N8N_CM_REFRESH_ACC;

const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

// In-memory store for who is waiting to type a message
// Note: serverless functions are stateless — this works for low traffic
// For high traffic, replace with Vercel KV or Upstash Redis
const waitingForReply = {};

const MENU = {
  keyboard: [
    [{ text: "📋 Assign Accounts" }],
    [{ text: "🔄 Refresh Account" }],
  ],
  resize_keyboard: true,
  is_persistent: true,
};

async function sendMessage(chatId, text, replyMarkup = null) {
  const body = {
    chat_id: chatId,
    text,
    ...(replyMarkup && { reply_markup: replyMarkup }),
  };
  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function callWebhook(url, payload) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.ok;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).json({ ok: true, message: "Bot is running." });
  }

  try {
    const { message } = req.body;
    if (!message || !message.text) return res.status(200).json({ ok: true });

    const chatId   = message.chat.id;
    const userId   = message.from.id;
    const username = message.from.username || String(userId);
    const text     = message.text;

    // /start command
    if (text === "/start") {
      await sendMessage(chatId, "👋 Choose an action:", MENU);
      return res.status(200).json({ ok: true });
    }

    // Button 1 — call webhook directly
    if (text === "📋 Assign Accounts") {
      const ok = await callWebhook(N8N_CM_ASSIGN_ACC, {
        tele_user_id: userId,
        user: username,
      });
      await sendMessage(chatId, ok ? "✅ Accounts assigned!" : "❌ Webhook failed.");
      return res.status(200).json({ ok: true });
    }

    // Button 2 — ask for input
    if (text === "🔄 Refresh Account") {
      waitingForReply[userId] = true;
      await sendMessage(chatId, "✏️ Type the account name to refresh:");
      return res.status(200).json({ ok: true });
    }

    // Waiting for reply after Button 2
    if (waitingForReply[userId]) {
      delete waitingForReply[userId];
      const ok = await callWebhook(N8N_CM_REFRESH_ACC, {
        tele_user_id: userId,
        user: username,
        message: text,
      });
      await sendMessage(chatId, ok ? "✅ Refresh request sent!" : "❌ Webhook failed.");
      return res.status(200).json({ ok: true });
    }

    // Fallback — show menu again
    await sendMessage(chatId, "Use the buttons below 👇", MENU);
    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error("Bot error:", err);
    return res.status(200).json({ ok: true }); // always 200 to Telegram
  }
}
