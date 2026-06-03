// Nutrition calculation utilities

export type Gender = 'male' | 'female' | 'other'
export type ActivityLevel = 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active'
export type Goal = 'weight_loss' | 'maintenance' | 'muscle_gain'

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
}

// Mifflin-St Jeor BMR
export function calculateBMR(weight: number, height: number, age: number, gender: Gender): number {
  const base = 10 * weight + 6.25 * height - 5 * age
  return gender === 'female' ? base - 161 : base + 5
}

export function calculateBMI(weight: number, height: number): number {
  const heightM = height / 100
  return weight / (heightM * heightM)
}

export function getBMICategory(bmi: number): string {
  if (bmi < 18.5) return 'Underweight'
  if (bmi < 25) return 'Normal'
  if (bmi < 30) return 'Overweight'
  return 'Obese'
}

export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel])
}

export interface NutritionGoals {
  calories: number
  protein: number
  carbs: number
  fat: number
  water_target: number
}

export function calculateGoals(params: {
  weight: number
  height: number
  age: number
  gender: Gender
  activityLevel: ActivityLevel
  goal: Goal
}): NutritionGoals {
  const { weight, height, age, gender, activityLevel, goal } = params
  const bmr = calculateBMR(weight, height, age, gender)
  const tdee = calculateTDEE(bmr, activityLevel)

  // Adjust calories based on goal
  let calories = tdee
  if (goal === 'weight_loss') calories = Math.round(tdee * 0.8) // 20% deficit
  if (goal === 'muscle_gain') calories = Math.round(tdee * 1.1) // 10% surplus

  // Macros:
  // Protein: 2g per kg body weight for muscle gain / 1.8g for maintenance / 1.6g for weight loss
  const proteinMultiplier =
    goal === 'muscle_gain' ? 2.0 : goal === 'maintenance' ? 1.8 : 1.6
  const protein = Math.round(weight * proteinMultiplier)

  // Fat: 25-30% of calories
  const fat = Math.round((calories * 0.27) / 9)

  // Remaining calories from carbs
  const carbs = Math.round((calories - protein * 4 - fat * 9) / 4)

  // Water target: 35ml per kg body weight
  const water_target = Math.round(weight * 35)

  return {
    calories,
    protein,
    carbs: Math.max(carbs, 0),
    fat,
    water_target,
  }
}

export function formatMacro(value: number, unit = 'g'): string {
  return `${Math.round(value)}${unit}`
}

export function getProgressPercent(consumed: number, goal: number): number {
  if (!goal) return 0
  return Math.min(Math.round((consumed / goal) * 100), 100)
}

export function getProgressColor(percent: number): string {
  if (percent >= 100) return '#4ECDC4'
  if (percent >= 75) return '#FF6B35'
  if (percent >= 50) return '#E91E8C'
  return '#555568'
}
