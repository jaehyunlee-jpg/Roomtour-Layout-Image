export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { image, mediaType, style, extra } = req.body;
  if (!image) return res.status(400).json({ error: 'image is required' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

  const stylePrompts = {
    line: 'floor plan, architectural line drawing, black and white, minimal',
    sketch: 'floor plan, pencil sketch, hand drawn, soft lines',
    blueprint: 'floor plan, blueprint style, white lines on blue background',
    anime: 'floor plan, anime style, colorful illustration',
    watercolor: 'floor plan, watercolor painting, soft pastel colors',
    minimal: 'floor plan, minimalist, simple geometric, modern'
  };

  const prompt = (stylePrompts[style] || stylePrompts.line) + (extra ? `, ${extra}` : '');

  try {
    const imgBuffer = Buffer.from(image, 'base64');
    
    const response = await fetch(
      'https://api-inference.huggingface.co/models/Falconsai/image_to_text',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/octet-stream',
        },
        body: imgBuffer,
        signal: AbortSignal.timeout(8000)
      }
    );

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: text });
    }

    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    return res.status(200).json({ result: base64, type: 'image' });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
