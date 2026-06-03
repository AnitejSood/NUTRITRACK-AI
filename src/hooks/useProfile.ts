import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'

export interface Profile {
  id: string
  username: string
  name: string | null
  phone: string | null
  age: number | null
  gender: 'male' | 'female' | 'other' | null
  height: number | null
  weight: number | null
  goal: 'weight_loss' | 'maintenance' | 'muscle_gain' | null
  activity_level: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | null
  onboarding_complete: boolean
}

export function useProfile() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['profile', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single()
      if (error) throw error
      return data as Profile
    },
  })
}

export function useUpdateProfile() {
  const { user } = useAuth()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (updates: Partial<Profile>) => {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user!.id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile', user?.id] })
    },
  })
}
