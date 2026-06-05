export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { image, mediaType, prompt } = req.body;
  if (!image || !prompt) {
    return res.status(400).json({ error: 'image and prompt are required' });
  }
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inline_data: { mime_type: mediaType || 'image/jpeg', data: image } },
              { text: `You are an SVG generator. Look at this floor plan image and recreate it as a clean SVG line drawing.

RULES:
- Output ONLY raw SVG code
- Start with <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
- End with </svg>
- Use only rect, line, polyline, path elements
- Black strokes (#1a1a1a) on white background
- No furniture, no text labels, no dimensions
- No markdown, no explanation, no code blocks
- Just the SVG code, nothing else` }
            ]
          }],
          generationConfig: { maxOutputTokens: 4096, temperature: 0 }
        })
      }
    );
    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'Gemini API error' });
    }
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return res.status(200).json({ result: text });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
