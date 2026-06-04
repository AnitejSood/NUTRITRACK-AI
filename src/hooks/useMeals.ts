import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import { todayISO } from '@/lib/utils'

export interface Meal {
  id: string
  user_id: string
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snacks'
  raw_input: string
  calories: number
  protein: number
  carbs: number
  fat: number
  confidence: number
  timestamp: string
  meal_items?: MealItem[]
}

export interface MealItem {
  id: string
  meal_id: string
  food_name: string
  quantity: number
  calories: number
  protein: number
  carbs: number
  fat: number
}

export function useTodayMeals() {
  const { user } = useAuth()
  const today = todayISO()

  return useQuery({
    queryKey: ['meals', user?.id, today],
    enabled: !!user,
    queryFn: async () => {
      const start = new Date(`${today}T00:00:00`).toISOString()
      const end = new Date(`${today}T23:59:59.999`).toISOString()
      const { data, error } = await supabase
        .from('meals')
        .select('*, meal_items(*)')
        .eq('user_id', user!.id)
        .gte('timestamp', start)
        .lte('timestamp', end)
        .order('timestamp', { ascending: true })
      if (error) throw error
      return data as Meal[]
    },
  })
}

export function useMealsByDate(date: string) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['meals', user?.id, date],
    enabled: !!user && !!date,
    queryFn: async () => {
      const start = new Date(`${date}T00:00:00`).toISOString()
      const end = new Date(`${date}T23:59:59.999`).toISOString()
      const { data, error } = await supabase
        .from('meals')
        .select('*, meal_items(*)')
        .eq('user_id', user!.id)
        .gte('timestamp', start)
        .lte('timestamp', end)
        .order('timestamp', { ascending: true })
      if (error) throw error
      return data as Meal[]
    },
  })
}

export function useMealsRange(startDate: string, endDate: string) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['meals-range', user?.id, startDate, endDate],
    enabled: !!user,
    queryFn: async () => {
      const start = new Date(`${startDate}T00:00:00`).toISOString()
      const end = new Date(`${endDate}T23:59:59.999`).toISOString()
      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .eq('user_id', user!.id)
        .gte('timestamp', start)
        .lte('timestamp', end)
        .order('timestamp', { ascending: true })
      if (error) throw error
      return data as Meal[]
    },
  })
}

export function useLogMeal() {
  const { user } = useAuth()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      meal_type: string
      raw_input: string
      calories: number
      protein: number
      carbs: number
      fat: number
      confidence: number
      items: Array<{
        food_name: string
        quantity: number
        calories: number
        protein: number
        carbs: number
        fat: number
      }>
    }) => {
      const { items, ...mealData } = payload

      const { data: meal, error: mealError } = await supabase
        .from('meals')
        .insert({ ...mealData, user_id: user!.id })
        .select()
        .single()

      if (mealError) throw mealError

      if (items.length > 0) {
        const { error: itemsError } = await supabase
          .from('meal_items')
          .insert(items.map(item => ({ ...item, meal_id: meal.id })))
        if (itemsError) throw itemsError
      }

      return meal
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meals'] })
    },
  })
}

export function useDeleteMeal() {
  const { user } = useAuth()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (mealId: string) => {
      const { error } = await supabase
        .from('meals')
        .delete()
        .eq('id', mealId)
        .eq('user_id', user!.id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meals'] })
    },
  })
}
