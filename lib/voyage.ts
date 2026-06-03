const VOYAGE_API = 'https://api.voyageai.com/v1/embeddings';
const MODEL = 'voyage-3';

export function isConfigured(): boolean {
  return Boolean(process.env.VOYAGE_API_KEY);
}

async function embed(input: string | string[], attempt = 0): Promise<number[][]> {
  const res = await fetch(VOYAGE_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
    },
    body: JSON.stringify({ model: MODEL, input }),
  });

  if (res.status === 429 && attempt < 3) {
    const delay = 1000 * 2 ** attempt; // 1s, 2s, 4s
    await new Promise((r) => setTimeout(r, delay));
    return embed(input, attempt + 1);
  }

  if (!res.ok) throw new Error(`Voyage API error: ${res.status}`);
  const json = await res.json();
  return (json.data as { embedding: number[] }[]).map((d) => d.embedding);
}

export async function embedText(text: string): Promise<number[]> {
  const results = await embed(text);
  return results[0] ?? [];
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  return embed(texts);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}
