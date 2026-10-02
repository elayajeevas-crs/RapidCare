export type EmergencyType = 'SNAKE_BITE' | 'INSECT_STING' | 'OTHER';

export interface ClassificationResult {
  emergencyType: EmergencyType;
  confidence: number;        // classification confidence only - NOT medical diagnosis
  requiresEmergencyCare: boolean;
  source: 'rules' | 'llm';
  matched: string[];
}

const RULES: Record<'SNAKE_BITE' | 'INSECT_STING', string[]> = {
  SNAKE_BITE: ['snake', 'snakebite', 'viper', 'cobra', 'krait', 'serpent'],
  INSECT_STING: ['insect', 'sting', 'stung', 'bee', 'wasp', 'hornet', 'scorpion', 'spider'],
};
const BITE_WORDS = ['bite', 'bitten', 'sting', 'stung'];

/** Deterministic keyword classifier. Used when no external AI is configured. */
export function classifyWithRules(input: string): ClassificationResult {
  const words = new Set(input.toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(Boolean));
  const hit = (list: string[]) => list.filter((w) => words.has(w) || words.has(w + 's'));
  const snake = hit(RULES.SNAKE_BITE);
  const insect = hit(RULES.INSECT_STING);
  if (!snake.length && !insect.length) {
    return { emergencyType: 'OTHER', confidence: 0, requiresEmergencyCare: false, source: 'rules', matched: [] };
  }
  const isSnake = snake.length >= insect.length;
  const matched = isSnake ? snake : insect;
  const hasBiteVerb = BITE_WORDS.some((b) => words.has(b));
  const confidence = Math.min(0.95, 0.6 + 0.1 * matched.length + (hasBiteVerb ? 0.15 : 0));
  return {
    emergencyType: isSnake ? 'SNAKE_BITE' : 'INSECT_STING',
    confidence: Number(confidence.toFixed(2)),
    requiresEmergencyCare: true, source: 'rules', matched,
  };
}

/** Entry point: LLM adapter slot when configured; any failure falls back to rules. */
export async function classifyEmergency(input: string): Promise<ClassificationResult> {
  // Future: if (process.env.OPENAI_API_KEY) try the LLM, validate its JSON, else fall through.
  return classifyWithRules(input);
}
