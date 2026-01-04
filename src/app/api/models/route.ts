import { NextResponse } from 'next/server';
import { AI_MODELS, DEFAULT_MODEL } from '@/types/models';

export async function GET() {
  const models = Object.values(AI_MODELS).map(model => ({
    id: model.id,
    name: model.name,
    description: model.description,
    provider: model.provider,
    isDefault: model.id === DEFAULT_MODEL,
  }));

  return NextResponse.json({
    models,
    defaultModel: DEFAULT_MODEL,
  });
}
