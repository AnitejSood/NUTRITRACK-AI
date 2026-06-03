import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import { todayISO } from '@/lib/utils'

export function useTodayWater() {
  const { user } = useAuth()
  const today = todayISO()

  return useQuery({
    queryKey: ['water', user?.id, today],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('water_logs')
        .select('amount_ml')
        .eq('user_id', user!.id)
        .gte('timestamp', `${today}T00:00:00`)
        .lte('timestamp', `${today}T23:59:59`)
      if (error) throw error
      const total = (data ?? []).reduce((sum, row) => sum + (row.amount_ml ?? 0), 0)
      return { total, logs: data ?? [] }
    },
  })
}

export function useWaterRange(startDate: string, endDate: string) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['water-range', user?.id, startDate, endDate],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('water_logs')
        .select('amount_ml, timestamp')
        .eq('user_id', user!.id)
        .gte('timestamp', `${startDate}T00:00:00`)
        .lte('timestamp', `${endDate}T23:59:59`)
        .order('timestamp', { ascending: true })
      if (error) throw error
      return data ?? []
    },
  })
}

export function useLogWater() {
  const { user } = useAuth()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (amount_ml: number) => {
      const { error } = await supabase
        .from('water_logs')
        .insert({ user_id: user!.id, amount_ml })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['water'] })
    },
  })
}
