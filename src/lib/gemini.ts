// Gemini API helper — structured JSON only
// Uses gemini-2.5-flash (free tier)

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

export interface FoodItem {
  name: string
  quantity: number
  calories: number
  protein: number
  carbs: number
  fat: number
}

export interface FoodLogResponse {
  foods: FoodItem[]
  totals: {
    calories: number
    protein: number
    carbs: number
    fat: number
  }
  confidence: number
}

export interface MealRecommendation {
  meal: string
  calories: number
  protein: number
  carbs: number
  fat: number
  reason: string
}

export interface DailyInsightResponse {
  summary: string
  protein_analysis: string
  water_analysis: string
  recommendations: string
}

async function callGemini(prompt: string): Promise<string> {
  if (!API_KEY) throw new Error('Gemini API key not set in .env.local')

  const response = await fetch(`${BASE_URL}?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        topP: 0.8,
        maxOutputTokens: 8192,
      },
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || `Gemini API error: ${response.status}`)
  }

  const data = await response.json()
  const parts: any[] = data.candidates?.[0]?.content?.parts ?? []

  console.log('[Gemini] Raw parts:', JSON.stringify(parts.map((p: any) => ({
    hasText: !!p.text,
    thought: !!p.thought,
    textPreview: p.text?.substring(0, 100),
  }))))

  // Strategy 1: Find the last non-thought text part
  for (let i = parts.length - 1; i >= 0; i--) {
    const part = parts[i]
    if (part.text && !part.thought) {
      const cleaned = extractJSON(part.text)
      if (cleaned) return cleaned
    }
  }

  // Strategy 2: Try ALL parts (including thought parts that might contain JSON)
  for (let i = parts.length - 1; i >= 0; i--) {
    const part = parts[i]
    if (part.text) {
      const cleaned = extractJSON(part.text)
      if (cleaned) return cleaned
    }
  }

  // Nothing worked — throw with debug info
  const allText = parts.map((p: any) => p.text || '').join('\n')
  console.error('[Gemini] Could not extract JSON from response:', allText)
  throw new Error(`Gemini returned unparseable response. Raw: ${allText.substring(0, 200)}`)
}

/** Try to extract valid JSON from a string that may contain markdown fences or extra text */
function extractJSON(raw: string): string | null {
  // Try direct parse
  const trimmed = raw.trim()
  try {
    JSON.parse(trimmed)
    return trimmed
  } catch { /* not valid JSON directly */ }

  // Try stripping markdown fences: ```json ... ``` or ``` ... ```
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  if (fenceMatch) {
    try {
      JSON.parse(fenceMatch[1].trim())
      return fenceMatch[1].trim()
    } catch { /* still not valid */ }
  }

  // Try extracting the first { ... } block
  const braceStart = raw.indexOf('{')
  const braceEnd = raw.lastIndexOf('}')
  if (braceStart !== -1 && braceEnd > braceStart) {
    const extracted = raw.substring(braceStart, braceEnd + 1)
    try {
      JSON.parse(extracted)
      return extracted
    } catch { /* not valid */ }
  }

  return null
}

// ── Food Logging ────────────────────────────────────────────────
export async function parseFoodEntry(userInput: string): Promise<FoodLogResponse> {
  const prompt = `You are an expert Indian nutritionist with deep knowledge of North Indian food.
The user has logged a meal. Analyze it and return ONLY a valid JSON object.

User input: "${userInput}"

Return this exact JSON structure (no markdown, no explanation, pure JSON):
{
  "foods": [
    {
      "name": "food name in English",
      "quantity": <number>,
      "calories": <integer>,
      "protein": <number in grams>,
      "carbs": <number in grams>,
      "fat": <number in grams>
    }
  ],
  "totals": {
    "calories": <integer sum>,
    "protein": <number sum>,
    "carbs": <number sum>,
    "fat": <number sum>
  },
  "confidence": <integer 0-100>
}

Use realistic Indian food nutrition values. For common dishes:
- Roti/Chapati: ~100 cal, 3g protein, 18g carbs, 2.5g fat each
- Aloo Paratha: ~210 cal, 6g protein, 27g carbs, 9g fat each
- Dal makhani (1 cup): ~290 cal, 13g protein, 35g carbs, 11g fat
- Paneer (100g): ~265 cal, 18g protein, 3g carbs, 20g fat
- Rice (1 cup cooked): ~200 cal, 4g protein, 44g carbs, 0.5g fat
- Rajma (1 cup): ~230 cal, 15g protein, 40g carbs, 1g fat`

  const raw = await callGemini(prompt)
  try {
    return JSON.parse(raw) as FoodLogResponse
  } catch {
    throw new Error('Failed to parse Gemini food response. Please try again.')
  }
}

// ── Meal Recommendation ──────────────────────────────────────────
export async function getMealRecommendation(remaining: {
  calories: number
  protein: number
  carbs: number
  fat: number
}): Promise<MealRecommendation> {
  const prompt = `You are an Indian nutrition coach. Prioritize North Indian foods.
The user needs to hit their remaining daily macros.

Remaining targets:
- Calories: ${remaining.calories} kcal
- Protein: ${remaining.protein}g
- Carbs: ${remaining.carbs}g
- Fat: ${remaining.fat}g

Recommend a realistic, affordable North Indian meal that matches these targets.
Prefer: Roti, Dal, Rajma, Chole, Paneer, Chicken Curry, Dahi, Milk, Lassi, Rice, Soya Chunks.
Avoid expensive or exotic foods.

Return ONLY this JSON (no markdown, pure JSON):
{
  "meal": "meal name and description",
  "calories": <integer>,
  "protein": <number>,
  "carbs": <number>,
  "fat": <number>,
  "reason": "brief explanation why this matches the targets"
}`

  const raw = await callGemini(prompt)
  try {
    return JSON.parse(raw) as MealRecommendation
  } catch {
    throw new Error('Failed to parse meal recommendation. Please try again.')
  }
}

// ── Daily Insights ────────────────────────────────────────────────
export async function generateDailyInsights(data: {
  calorieTarget: number
  proteinTarget: number
  carbsTarget: number
  fatTarget: number
  waterTarget: number
  caloriesConsumed: number
  proteinConsumed: number
  carbsConsumed: number
  fatConsumed: number
  waterConsumed: number
}): Promise<DailyInsightResponse> {
  const prompt = `You are an Indian nutrition coach reviewing today's food log.

The user's DAILY TARGETS and what they have ACTUALLY CONSUMED today are listed below.
The format is: "Consumed (actual intake) → Target (daily goal)"

- Calories: Consumed ${data.caloriesConsumed} kcal → Target ${data.calorieTarget} kcal
- Protein: Consumed ${data.proteinConsumed}g → Target ${data.proteinTarget}g
- Carbs: Consumed ${data.carbsConsumed}g → Target ${data.carbsTarget}g
- Fat: Consumed ${data.fatConsumed}g → Target ${data.fatTarget}g
- Water: Consumed ${data.waterConsumed}ml → Target ${data.waterTarget}ml

IMPORTANT: The first number is what was ACTUALLY EATEN today. The second number is the DAILY GOAL/TARGET.
If consumed < target, the user is UNDER their goal and needs to eat more.
If consumed > target, the user has EXCEEDED their goal.

Generate personalized insights based on the above. Suggest Indian foods where relevant.
Return ONLY this JSON (no markdown, pure JSON):
{
  "summary": "2-3 sentence overall day summary",
  "protein_analysis": "1-2 sentences about protein intake with % achieved",
  "water_analysis": "1-2 sentences about water intake",
  "recommendations": "2-3 specific actionable suggestions for tomorrow using Indian foods like paneer, dahi, rajma, dal, etc."
}`

  const raw = await callGemini(prompt)
  try {
    return JSON.parse(raw) as DailyInsightResponse
  } catch {
    throw new Error('Failed to parse insights. Please try again.')
  }
}
