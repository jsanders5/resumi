import { NextRequest, NextResponse } from 'next/server';
import { getDocumentProxy, extractText } from 'unpdf';
import { embedText, isConfigured as voyageConfigured } from '@/lib/voyage';
import { extractResumeProfile } from '@/lib/claude';

async function parsePdf(buffer: Buffer): Promise<string> {
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, { mergePages: true });
  return text;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('resume') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
    if (buffer.length > MAX_BYTES) {
      return NextResponse.json({ error: 'File too large. Maximum size is 10 MB.' }, { status: 413 });
    }

    if (!file.name.endsWith('.pdf') && !file.name.endsWith('.txt')) {
      return NextResponse.json({ error: 'Only PDF and .txt files are supported.' }, { status: 415 });
    }

    const text = file.name.endsWith('.pdf')
      ? await parsePdf(buffer)
      : buffer.toString('utf-8');

    if (!text.trim()) {
      return NextResponse.json({ error: 'Could not extract text from file' }, { status: 400 });
    }

    // Embed and extract profile for richer context in scoring
    const [embedding, profile] = await Promise.all([
      voyageConfigured() ? embedText(text) : Promise.resolve([]),
      extractResumeProfile(text),
    ]);

    return NextResponse.json({ text: text.trim(), embedding, profile });
  } catch (err) {
    console.error('parse-resume error:', err);
    return NextResponse.json({ error: 'Failed to parse resume' }, { status: 500 });
  }
}
