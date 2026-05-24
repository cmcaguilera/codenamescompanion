import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
  }

  let body: { image?: string; mimeType?: string; type?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { image, mimeType = 'image/jpeg', type } = body;

  if (!image || !type) {
    return NextResponse.json({ error: 'Missing image or type' }, { status: 400 });
  }
  if (type !== 'words' && type !== 'colors') {
    return NextResponse.json({ error: 'type must be "words" or "colors"' }, { status: 400 });
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt =
    type === 'words'
      ? `This is a photo of a Codenames board game. The board is a 5x5 grid of 25 word cards laid out on a table.
Identify all 25 words visible on the cards, reading left to right, top to bottom (row by row).
Return ONLY a valid JSON array of exactly 25 strings with no markdown, code fences, or explanation.
Each string should be the word shown on that card in uppercase. If a word is unclear, make your best guess.
Example: ["WORD1","WORD2","WORD3",...,"WORD25"]`
      : `You are reading a Codenames key card (the spymaster's secret color map). This is a physical card with a 5×5 grid of exactly 25 colored squares arranged in 5 rows and 5 columns.

Color definitions (use these exact strings):
- "red"   = clearly red or crimson colored squares
- "blue"  = clearly blue colored squares
- "beige" = tan, cream, or light-colored neutral squares — distinctly lighter and more muted than red; a sandy or yellowish-cream tone
- "black" = the single very dark or black square (there is exactly one on the card)

Instructions:
1. Identify the rectangular 5×5 grid boundary on the card.
2. Read the squares strictly left to right, row by row, starting from the top-left corner.
3. For each of the 25 squares output exactly one color string.
4. Key distinction: beige squares are clearly lighter and more neutral-toned than red squares. Pinkish-red → "red". Sandy/cream/light-tan → "beige".
5. Count to confirm you have exactly 25 values before responding.

Return ONLY a JSON array of exactly 25 strings. No markdown, no explanation, no code fences.
Each string must be one of: "red", "blue", "beige", "black"
Example: ["red","blue","beige","black","red","blue","beige","red","blue","red","beige","blue","red","beige","blue","red","blue","beige","red","blue","red","beige","blue","red","black"]`;

  try {
    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { data: image, mimeType } },
            { text: prompt },
          ],
        },
      ],
      generationConfig: {
        temperature: 0,
        ...(type === 'colors' ? { responseMimeType: 'application/json' } : {}),
      },
    });

    const text = result.response.text().trim();

    // Strip markdown code fences if present
    const cleaned = text.replace(/```(?:json)?\n?/g, '').trim();
    const match = cleaned.match(/\[[\s\S]*\]/);
    if (!match) {
      console.error('Gemini raw response:', text);
      return NextResponse.json({ error: 'Could not parse vision response' }, { status: 500 });
    }

    let parsed: string[];
    try {
      parsed = JSON.parse(match[0]);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON in vision response' }, { status: 500 });
    }

    if (!Array.isArray(parsed) || parsed.length !== 25) {
      return NextResponse.json(
        { error: `Expected 25 items, got ${parsed.length}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: parsed });
  } catch (err) {
    console.error('Vision API error:', err);
    return NextResponse.json({ error: 'Vision API request failed' }, { status: 500 });
  }
}
