import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'

export interface NutritionGoals {
  id?: string
  user_id: string
  calories: number
  protein: number
  carbs: number
  fat: number
  water_target: number
}

export function useGoals() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['goals', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nutrition_goals')
        .select('*')
        .eq('user_id', user!.id)
        .single()
      if (error) throw error
      return data as NutritionGoals
    },
  })
}

export function useUpsertGoals() {
  const { user } = useAuth()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (goals: Omit<NutritionGoals, 'id' | 'user_id'>) => {
      const { data, error } = await supabase
        .from('nutrition_goals')
        .upsert({ ...goals, user_id: user!.id }, { onConflict: 'user_id' })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['goals', user?.id] })
    },
  })
}
