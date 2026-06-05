export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { image, mediaType, style } = req.body;
  if (!image) {
    return res.status(400).json({ error: 'image is required' });
  }
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  const styleMap = {
    line: 'lineart',
    sketch: 'scribble',
    blueprint: 'lineart',
    anime: 'anime',
    watercolor: 'watercolor'
  };

  const controlnetStyle = styleMap[style] || 'lineart';

  try {
    const blob = await fetch(`data:${mediaType};base64,${image}`).then(r => r.blob());
    const formData = new FormData();
    formData.append('inputs', blob, 'image.jpg');

    const model = style === 'anime' 
      ? 'lllyasviel/sd-controlnet-scribble'
      : 'lllyasviel/sd-controlnet-lineart';

    const response = await fetch(
      `https://api-inference.huggingface.co/models/lllyasviel/sd-controlnet-lineart`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: image,
          parameters: {
            prompt: style === 'blueprint' 
              ? 'architectural blueprint, white lines on blue background, technical drawing'
              : style === 'anime'
              ? 'anime style floor plan illustration, clean lines, colorful'
              : 'clean architectural line drawing, black lines on white background, minimal'
          }
        })
      }
    );

    if (!response.ok) {
      const err = await response.json();
      return res.status(response.status).json({ error: err.error || 'Hugging Face API error' });
    }

    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    return res.status(200).json({ result: base64, type: 'image' });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
