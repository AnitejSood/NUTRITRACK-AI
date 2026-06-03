import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import { todayISO } from '@/lib/utils'

export interface DailyInsight {
  id: string
  user_id: string
  insight_date: string
  summary: string | null
  protein_analysis: string | null
  water_analysis: string | null
  recommendations: string | null
  created_at: string
}

export function useTodayInsight() {
  const { user } = useAuth()
  const today = todayISO()

  return useQuery({
    queryKey: ['insights', user?.id, today],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from('daily_insights')
        .select('*')
        .eq('user_id', user!.id)
        .eq('insight_date', today)
        .single()
      return data as DailyInsight | null
    },
  })
}

export function useInsightHistory() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['insights-history', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_insights')
        .select('*')
        .eq('user_id', user!.id)
        .order('insight_date', { ascending: false })
        .limit(30)
      if (error) throw error
      return (data ?? []) as DailyInsight[]
    },
  })
}

export function useSaveInsight() {
  const { user } = useAuth()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (insight: {
      insight_date: string
      summary: string
      protein_analysis: string
      water_analysis: string
      recommendations: string
    }) => {
      const { error } = await supabase
        .from('daily_insights')
        .upsert({ ...insight, user_id: user!.id }, { onConflict: 'user_id,insight_date' })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['insights'] })
    },
  })
}
