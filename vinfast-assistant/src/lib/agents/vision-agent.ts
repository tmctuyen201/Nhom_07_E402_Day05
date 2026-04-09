/**
 * Vision Agent: analyzes dashboard warning light images
 *
 * Uses OpenAI Vision API (gpt-4o-mini with image input) to:
 *   - Identify dashboard warning lights from uploaded images
 *   - Provide immediate safety guidance
 *   - Return urgency level and recommended actions
 *   - Map to relevant knowledge base chunks
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical';

export interface VisionAnalysis {
  detected: string;
  description: string;
  urgency: UrgencyLevel;
  immediateActions: string[];
  relatedChunks: string[]; // IDs of related knowledge chunks
  confidence: number;
}

interface VisionAPIToolResult {
  role: 'tool';
  id: string;
  input: Record<string, unknown>;
}

interface VisionAPIMessage {
  role: 'user';
  content: Array<{
    type: 'text' | 'image_url';
    text?: string;
    image_url?: { url: string; detail?: 'low' | 'high' | 'auto' };
  }>;
}

// ---------------------------------------------------------------------------
// Known Warning Light Mappings (fallback + supplementary context)
// ---------------------------------------------------------------------------

const KNOWN_WARNING_LIGHTS: Record<string, { urgency: UrgencyLevel; actions: string[]; chunks: string[] }> = {
  'check engine': {
    urgency: 'high',
    actions: [
      'Avoid high-speed driving if possible.',
      'Visit an authorized VinFast service center as soon as possible.',
      'Check for loose fuel cap as a quick fix.',
    ],
    chunks: ['warning-lights-check-engine', 'vinfast-maintenance-check-engine'],
  },
  'battery / charging': {
    urgency: 'high',
    actions: [
      'Stop driving immediately if battery is critically low.',
      'Do not turn off the vehicle if charging is active.',
      'Contact VinFast roadside assistance immediately.',
    ],
    chunks: ['warning-lights-battery', 'vinfast-ev-battery-warning'],
  },
  'tire pressure': {
    urgency: 'medium',
    actions: [
      'Check tire pressure at the nearest gas station or tire shop.',
      'Inflate to recommended pressure (check driver door jamb sticker).',
      'Do not ignore — low tire pressure affects braking and handling.',
    ],
    chunks: ['warning-lights-tire-pressure', 'vinfast-tpms-guide'],
  },
  'oil pressure': {
    urgency: 'critical',
    actions: [
      'Pull over safely and stop the vehicle immediately.',
      'Do NOT continue driving — engine can seize within minutes.',
      'Call VinFast roadside assistance.',
    ],
    chunks: ['warning-lights-oil-pressure', 'vinfast-maintenance-oil'],
  },
  'abs': {
    urgency: 'medium',
    actions: [
      'Drive cautiously — ABS may not assist in emergency braking.',
      'Have the system checked before long trips.',
      'Regular brakes still function; drive to nearest service center.',
    ],
    chunks: ['warning-lights-abs', 'vinfast-safety-systems'],
  },
  'airbag': {
    urgency: 'high',
    actions: [
      'Have the airbag system inspected immediately.',
      'Do not ignore — airbags may not deploy in a crash.',
      'Visit an authorized VinFast service center.',
    ],
    chunks: ['warning-lights-airbag', 'vinfast-safety-systems'],
  },
  'brake': {
    urgency: 'critical',
    actions: [
      'Pull over and stop immediately.',
      'Do NOT drive the vehicle.',
      'Call VinFast roadside assistance or a tow truck.',
    ],
    chunks: ['warning-lights-brake', 'vinfast-maintenance-brakes'],
  },
  'temperature / overheating': {
    urgency: 'critical',
    actions: [
      'Pull over safely and turn off the engine immediately.',
      'Do NOT open the radiator cap while hot.',
      'Allow engine to cool, then check coolant level.',
      'Call VinFast roadside assistance if coolant is low.',
    ],
    chunks: ['warning-lights-temperature', 'vinfast-maintenance-cooling'],
  },
  'door open': {
    urgency: 'low',
    actions: [
      'Check that all doors are fully closed.',
      'Ensure no one is exiting the vehicle.',
    ],
    chunks: ['warning-lights-door-open'],
  },
  'seatbelt': {
    urgency: 'low',
    actions: [
      'Ensure all occupants have fastened their seatbelts.',
      'Check for items on seats that may trigger the sensor.',
    ],
    chunks: ['warning-lights-seatbelt'],
  },
};

// ---------------------------------------------------------------------------
// OpenAI Vision API Call
// ---------------------------------------------------------------------------

async function callVisionAPI(
  imageData: string,
  openaiApiKey: string
): Promise<{
  detected: string;
  description: string;
  confidence: number;
}> {
  const messages: VisionAPIMessage[] = [
    {
      role: 'user',
      content: [
        {
          type: 'image_url',
          image_url: {
            url: imageData.startsWith('data:') ? imageData : `data:image/jpeg;base64,${imageData}`,
            detail: 'auto',
          },
        },
        {
          type: 'text',
          text: `You are a VinFast car assistant. Analyze the dashboard image provided.

Your task:
1. Identify any warning lights, indicator lights, or dashboard symbols visible in the image.
2. Provide a clear description of what each light means in the context of VinFast vehicles.
3. State your confidence that the identification is correct (0.0 to 1.0).

Respond ONLY with a valid JSON object (no markdown, no code fences) with this exact structure:
{
  "detected": "The name of the detected warning light or indicator (e.g., 'check engine', 'battery / charging', 'tire pressure'). Use 'none' if no warning lights are visible.",
  "description": "A clear, concise explanation of what this light means and why it appeared.",
  "confidence": 0.95
}

If no warning light is detected, set detected to "none" and description to "No dashboard warning lights were detected in the image."`,
        },
      ],
    },
  ];

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${openaiApiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 300,
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => 'Unknown error');
    throw new Error(`Vision API error ${response.status}: ${errorBody}`);
  }

  const data = await response.json();

  const rawContent = data.choices?.[0]?.message?.content as string | undefined;
  if (!rawContent) {
    throw new Error('Vision API returned an empty response.');
  }

  // Strip markdown fences if present
  const cleaned = rawContent.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();

  let parsed: { detected: string; description: string; confidence: number };
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // If JSON parsing fails, fall back to a safe default
    parsed = {
      detected: 'unknown',
      description: `Could not parse the Vision API response. The model returned: "${rawContent.slice(0, 200)}"`,
      confidence: 0,
    };
  }

  return {
    detected: parsed.detected ?? 'unknown',
    description: parsed.description ?? 'No description available.',
    confidence: typeof parsed.confidence === 'number' ? Math.min(1, Math.max(0, parsed.confidence)) : 0.5,
  };
}

// ---------------------------------------------------------------------------
// Main Vision Agent
// ---------------------------------------------------------------------------

/**
 * Analyzes a dashboard image using OpenAI Vision API and returns
 * structured safety guidance.
 *
 * @param imageData   - Base64-encoded image data (with or without data URI prefix)
 * @param openaiApiKey - OpenAI API key
 * @returns VisionAnalysis with detected light, urgency, and recommended actions
 */
export async function runVisionAgent(
  imageData: string,
  openaiApiKey: string
): Promise<VisionAnalysis> {
  if (!imageData || imageData.length < 100) {
    return {
      detected: 'unknown',
      description: 'The provided image data appears to be empty or invalid.',
      urgency: 'medium',
      immediateActions: ['Please upload a clearer image of your dashboard.'],
      relatedChunks: [],
      confidence: 0,
    };
  }

  // Normalize: ensure data URI prefix
  const normalizedImage = imageData.startsWith('data:')
    ? imageData
    : `data:image/jpeg;base64,${imageData}`;

  const { detected, description, confidence } = await callVisionAPI(normalizedImage, openaiApiKey);

  // Look up known warning light
  const normalizedDetected = detected.toLowerCase().trim();
  const matchedKey = Object.keys(KNOWN_WARNING_LIGHTS).find((key) =>
    normalizedDetected.includes(key) || key.includes(normalizedDetected)
  );

  if (matchedKey) {
    const known = KNOWN_WARNING_LIGHTS[matchedKey];
    return {
      detected: matchedKey,
      description,
      urgency: known.urgency,
      immediateActions: known.actions,
      relatedChunks: known.chunks,
      confidence,
    };
  }

  // Unknown but the model returned something
  if (normalizedDetected === 'none') {
    return {
      detected: 'none',
      description,
      urgency: 'low',
      immediateActions: ['No action needed — no warning lights detected.'],
      relatedChunks: [],
      confidence,
    };
  }

  // Unknown warning light
  return {
    detected: normalizedDetected,
    description,
    urgency: 'high', // Treat unknown warning as potentially serious
    immediateActions: [
      'This warning light is not immediately recognized.',
      'Treat it as a potential safety concern.',
      'Please visit an authorized VinFast service center or contact VinFast support.',
    ],
    relatedChunks: [],
    confidence,
  };
}
