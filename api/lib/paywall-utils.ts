import type { SupabaseClient } from '@supabase/supabase-js';

export const normalizeIds = (ids: Array<string | null | undefined>): string[] => {
  const unique = new Set<string>();
  ids.forEach(id => {
    if (!id) return;
    const trimmed = id.trim();
    if (trimmed) {
      unique.add(trimmed);
    }
  });
  return Array.from(unique);
};

export const hasUnlimitedAccess = async (
  supabase: SupabaseClient,
  options: { userId?: string | null; deviceIds?: Array<string | null | undefined> }
): Promise<boolean> => {
  const { userId, deviceIds = [] } = options;
  const normalizedDeviceIds = normalizeIds(deviceIds);
  
  // Verificar se há pagamentos bem-sucedidos recentes (últimas 24 horas)
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  
  try {
    // Construir filtros para buscar transações do usuário ou dispositivo
    const orFilters: string[] = [];
    
    if (userId && userId !== 'guest') {
      orFilters.push(`user_id.eq.${userId}`);
    }
    
    normalizedDeviceIds.forEach(deviceId => {
      if (deviceId) {
        orFilters.push(`metadata->>deviceId.eq.${deviceId}`);
      }
    });
    
    if (orFilters.length === 0) {
      return false;
    }
    
    // Buscar transações bem-sucedidas recentes
    const { data: recentPayments, error } = await supabase
      .from('stripe_transactions')
      .select('payment_intent_id, status, created_at, user_id, metadata')
      .eq('status', 'succeeded')
      .gte('created_at', twentyFourHoursAgo)
      .or(orFilters.join(','))
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (error) {
      console.error('[PAYWALL] Erro ao verificar pagamentos recentes:', error);
      return false;
    }
    
    // Se encontrou pagamento recente bem-sucedido, liberar acesso
    if (recentPayments && recentPayments.length > 0) {
      console.log('[PAYWALL] Acesso liberado por pagamento recente:', recentPayments[0].payment_intent_id);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('[PAYWALL] Exceção ao verificar acesso premium:', error);
    return false;
  }
};

export interface UsageLookupOptions {
  userId?: string | null;
  deviceIds?: Array<string | null | undefined>;
}

export interface UsageRecord {
  device_id: string | null;
  user_id: string | null;
  freesongsused: number;
  last_used_ip: string | null;
  creations?: number | null;
}

export interface UsageLookupResult {
  records: UsageRecord[];
  primaryRecord: UsageRecord | null;
  maxFreeSongs: number;
}

export const resolveFreeUsage = async (
  supabase: SupabaseClient,
  options: UsageLookupOptions
): Promise<UsageLookupResult> => {
  const { userId, deviceIds = [] } = options;
  const normalizedDeviceIds = normalizeIds(deviceIds);
  const orFilters: string[] = [];

  if (userId) {
    orFilters.push(`user_id.eq.${userId}`);
  }

  normalizedDeviceIds.forEach(id => {
    orFilters.push(`device_id.eq.${id}`);
  });

  if (orFilters.length === 0) {
    return { records: [], primaryRecord: null, maxFreeSongs: 0 };
  }

  const { data, error } = await supabase
    .from('user_creations')
    .select('device_id, user_id, freesongsused, last_used_ip, creations, updated_at')
    .or(orFilters.join(','))
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('[PAYWALL] Erro ao resolver uso gratuito:', error);
    throw error;
  }

  const records: UsageRecord[] = (data ?? []).map(row => ({
    device_id: row.device_id ?? null,
    user_id: row.user_id ?? null,
    freesongsused: row.freesongsused ?? 0,
    last_used_ip: row.last_used_ip ?? null,
    creations: row.creations ?? null,
  }));

  if (records.length === 0) {
    return { records: [], primaryRecord: null, maxFreeSongs: 0 };
  }

  let primaryRecord: UsageRecord | null = null;

  if (userId) {
    primaryRecord = records.find(record => record.user_id === userId) ?? null;
  }

  if (!primaryRecord && normalizedDeviceIds.length > 0) {
    primaryRecord = records.find(record => record.device_id && normalizedDeviceIds.includes(record.device_id)) ?? null;
  }

  if (!primaryRecord) {
    primaryRecord = records[0] ?? null;
  }

  const maxFreeSongs = records.reduce((max, record) => {
    const value = typeof record.freesongsused === 'number' ? record.freesongsused : 0;
    return value > max ? value : max;
  }, 0);

  return { records, primaryRecord, maxFreeSongs };
};

export const syncUsageRecords = async (
  supabase: SupabaseClient,
  records: UsageRecord[],
  newCount: number,
  options: { userId?: string | null; lastUsedIp?: string | null } = {}
): Promise<void> => {
  if (!records.length) {
    return;
  }

  const updates = records
    .filter(record => !!record.device_id)
    .map(record => {
      const updateData: Record<string, unknown> = {
        freesongsused: newCount,
      };

      if (options.userId && record.user_id !== options.userId) {
        updateData.user_id = options.userId;
      }

      if (options.lastUsedIp) {
        updateData.last_used_ip = options.lastUsedIp;
      }

      return supabase
        .from('user_creations')
        .update(updateData)
        .eq('device_id', record.device_id as string);
    });

  await Promise.all(updates);
};
