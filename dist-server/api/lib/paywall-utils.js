export const normalizeIds = (ids) => {
    const unique = new Set();
    ids.forEach(id => {
        if (!id)
            return;
        const trimmed = id.trim();
        if (trimmed) {
            unique.add(trimmed);
        }
    });
    return Array.from(unique);
};
export const hasUnlimitedAccess = async (supabase, options) => {
    const { userId, deviceIds = [] } = options;
    const normalizedDeviceIds = normalizeIds(deviceIds);
    try {
        // Construir filtros para buscar transações do usuário ou dispositivo
        const orFilters = [];
        if (userId && userId !== 'guest') {
            orFilters.push(`user_id.eq.${userId}`);
        }
        normalizedDeviceIds.forEach(deviceId => {
            if (deviceId) {
                orFilters.push(`metadata->>deviceId.eq.${deviceId}`);
                orFilters.push(`stripe_payment_intent_data->metadata->>deviceId.eq.${deviceId}`);
            }
        });
        if (userId && userId !== 'guest') {
            orFilters.push(`stripe_payment_intent_data->metadata->>userId.eq.${userId}`);
        }
        if (orFilters.length === 0) {
            return { hasAccess: false, transaction: null };
        }
        const { data: availablePayments, error } = await supabase
            .from('stripe_transactions')
            .select('id, payment_intent_id, available_credits, credit_consumed_at, metadata')
            .eq('status', 'succeeded')
            .gt('available_credits', 0)
            .is('credit_consumed_at', null)
            .or(orFilters.join(','))
            .order('created_at', { ascending: false })
            .limit(1);
        if (error) {
            console.error('[PAYWALL] Erro ao verificar créditos pagos disponíveis:', error);
            return { hasAccess: false, transaction: null };
        }
        const record = availablePayments?.[0];
        if (!record) {
            return { hasAccess: false, transaction: null };
        }
        return {
            hasAccess: true,
            transaction: {
                id: record.id,
                payment_intent_id: record.payment_intent_id,
                available_credits: record.available_credits ?? 0,
            }
        };
    }
    catch (error) {
        console.error('[PAYWALL] Exceção ao verificar acesso premium:', error);
        return { hasAccess: false, transaction: null };
    }
};
export const consumePaidCredit = async (supabase, transactionId) => {
    try {
        const { data, error } = await supabase.rpc('consume_paid_credit', {
            transaction_id: transactionId,
        });
        if (error) {
            console.error('[PAYWALL] Erro ao consumir crédito pago:', error);
            return { success: false, remainingCredits: 0 };
        }
        const record = Array.isArray(data) ? data[0] : data;
        if (!record) {
            console.warn('[PAYWALL] Nenhum crédito disponível para consumir (possível uso duplo).', transactionId);
            return { success: false, remainingCredits: 0 };
        }
        return {
            success: true,
            remainingCredits: record.remaining_credits ?? 0,
        };
    }
    catch (error) {
        console.error('[PAYWALL] Exceção ao consumir crédito pago:', error);
        return { success: false, remainingCredits: 0 };
    }
};
export const resolveFreeUsage = async (supabase, options) => {
    const { userId, deviceIds = [] } = options;
    const normalizedDeviceIds = normalizeIds(deviceIds);
    const orFilters = [];
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
    const records = (data ?? []).map(row => ({
        device_id: row.device_id ?? null,
        user_id: row.user_id ?? null,
        freesongsused: row.freesongsused ?? 0,
        last_used_ip: row.last_used_ip ?? null,
        creations: row.creations ?? null,
    }));
    if (records.length === 0) {
        return { records: [], primaryRecord: null, maxFreeSongs: 0 };
    }
    let primaryRecord = null;
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
export const syncUsageRecords = async (supabase, records, newCount, options = {}) => {
    if (!records.length) {
        return;
    }
    const updates = records
        .filter(record => !!record.device_id)
        .map(record => {
        const updateData = {
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
            .eq('device_id', record.device_id);
    });
    await Promise.all(updates);
};
//# sourceMappingURL=paywall-utils.js.map