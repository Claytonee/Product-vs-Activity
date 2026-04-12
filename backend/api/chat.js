const allowedOrigins = ['*'];

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', allowedOrigins.join(','));
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, mode } = req.body || {};

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: "Missing or invalid 'message' field." });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Server configuration missing API key.' });
    }

    let prompt = message;

    if (mode === 'classify') {
      prompt = `You are an M&E specialist. Classify the following phrase strictly as PRODUCT or ACTIVITY. Answer with a single label and a short explanation.\n\nPhrase: "${message}"`;
    } else if (mode === 'convert') {
      prompt = `You are an M&E specialist. Convert the following activity into a proper product phrase using the format: [Product Name] (key detail of what is captured/measured). Do not include any extra text.\n\nActivity: "${message}"`;
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 250
      })
    });

    const json = await response.json();

    if (!response.ok) {
      const errorMessage = json.error?.message || response.statusText || 'Unknown API error';
      return res.status(502).json({ error: `Groq API error: ${errorMessage}` });
    }

    const reply = json.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      return res.status(502).json({ error: 'Invalid response format from AI provider.' });
    }

    return res.status(200).json({ reply });
  } catch (error) {
    console.error('API handler error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
