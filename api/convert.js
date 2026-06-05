export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { image, mediaType, style, extra } = req.body;
  if (!image) return res.status(400).json({ error: 'image is required' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

  const stylePrompts = {
    line: 'architectural floor plan, clean black line drawing on white background, minimal, no color, no furniture',
    sketch: 'hand drawn sketch of floor plan, pencil drawing style, soft lines on white paper',
    blueprint: 'architectural blueprint, white lines on dark blue background, technical drawing style',
    anime: 'anime style illustration of floor plan, colorful, clean lines, japanese manga style',
    watercolor: 'watercolor illustration of floor plan, soft pastel colors, artistic style',
    minimal: 'minimalist floor plan illustration, simple geometric shapes, modern design, black and white'
  };

  const prompt = stylePrompts[style] || stylePrompts.line;
  const fullPrompt = extra ? `${prompt}, ${extra}` : prompt;

  try {
    const imgBuffer = Buffer.from(image, 'base64');
    
    const response = await fetch(
      'https://api-inference.huggingface.co/models/lllyasviel/control_v11p_sd15_lineart',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/octet-stream',
          'x-use-cache': 'false'
        },
        body: imgBuffer
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
