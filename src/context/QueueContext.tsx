import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Service, Barber, Settings, QueueEntry } from '../types';

interface QueueContextType {
  services: Service[];
  barbers: Barber[];
  settings: Settings | null;
  queueEntries: QueueEntry[];
  loading: boolean;
  isLive: boolean;
  waitingCount: number;
  overallWaitMinutes: number;
  isOnlineTokensPaused: boolean;
  pauseReason: string;
  getBarberWaitMinutes: (barberId: string) => number;
  getBarberStatus: (barber: Barber) => 'Working' | 'Free' | 'On break';
  takeOnlineToken: (
    customerName: string,
    phone: string,
    serviceIds: string[],
    preferredBarberId?: string | null
  ) => Promise<{ tokenId: string; isExisting?: boolean }>;
  findActiveTokenByPhone: (phone: string) => Promise<QueueEntry | null>;
  getTokenById: (tokenId: string) => Promise<QueueEntry | null>;
  extendRunningLate: (tokenId: string) => Promise<boolean>;
  releaseCustomerToken: (tokenId: string) => Promise<boolean>;
  callNextCustomer: (barberId: string) => Promise<QueueEntry | null>;
  addWalkinCustomer: (
    name: string,
    phone: string,
    serviceIds: string[],
    preferredBarberId?: string | null
  ) => Promise<QueueEntry>;
  markNoShowCustomer: (tokenId: string) => Promise<boolean>;
  toggleOnlineTokens: (enabled: boolean) => Promise<void>;
  refreshData: () => Promise<void>;
}

const defaultServices: Service[] = [
  { id: '11111111-1111-1111-1111-111111111111', name_en: 'Haircut', name_gu: 'હેરકટ', minutes: 60, price: 300, icon: 'scissors', active: true },
  { id: '22222222-2222-2222-2222-222222222222', name_en: 'Beard trimming', name_gu: 'દાઢી ટ્રીમિંગ', minutes: 40, price: 400, icon: 'scissors', active: true },
  { id: '33333333-3333-3333-3333-333333333333', name_en: 'Facial', name_gu: 'ફેશિયલ', minutes: 45, price: 750, icon: 'sparkles', active: true },
  { id: '44444444-4444-4444-4444-444444444444', name_en: 'Hair wash', name_gu: 'હેર વોશ', minutes: 20, price: 150, icon: 'droplets', active: true },
  { id: '55555555-5555-5555-5555-555555555555', name_en: 'Massage', name_gu: 'મસાજ', minutes: 20, price: 200, icon: 'hand', active: true },
];

const defaultBarbers: Barber[] = [
  { id: 'aaaa1111-aaaa-1111-aaaa-111111111111', name: 'Mahesh', working_today: true, on_break: false },
  { id: 'bbbb2222-bbbb-2222-bbbb-222222222222', name: 'Suresh', working_today: true, on_break: false },
  { id: 'cccc3333-cccc-3333-cccc-333333333333', name: 'Ashlesh', working_today: true, on_break: false },
];

const defaultSettings: Settings = {
  id: 1,
  salon_name: 'ALL1',
  open_time: '10:00',
  close_time: '21:00',
  online_tokens_on: true,
  last_token: 0,
  token_date: new Date().toISOString().split('T')[0],
};

const QueueContext = createContext<QueueContextType | null>(null);

export const QueueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [services, setServices] = useState<Service[]>(defaultServices);
  const [barbers, setBarbers] = useState<Barber[]>(defaultBarbers);
  const [settings, setSettings] = useState<Settings | null>(defaultSettings);
  const [queueEntries, setQueueEntries] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isLive, setIsLive] = useState<boolean>(true);

  // Local offline queue store to support browser refresh without database
  const getLocalQueue = (): QueueEntry[] => {
    try {
      const stored = localStorage.getItem('all1_mock_queue');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const saveLocalQueue = (entries: QueueEntry[]) => {
    try {
      localStorage.setItem('all1_mock_queue', JSON.stringify(entries));
    } catch (e) {
      console.warn('Failed to persist local mock queue', e);
    }
  };

  const fetchData = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setQueueEntries(getLocalQueue());
      setLoading(false);
      return;
    }

    try {
      // 1. Fetch settings
      const { data: sData, error: sErr } = await supabase
        .from('settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle();

      if (!sErr && sData) {
        setSettings(sData as Settings);
      }

      // 2. Fetch services
      const { data: srvData, error: srvErr } = await supabase
        .from('services')
        .select('*')
        .order('price', { ascending: true });

      if (!srvErr && srvData && srvData.length > 0) {
        setServices(srvData as Service[]);
      }

      // 3. Fetch barbers
      const { data: bData, error: bErr } = await supabase
        .from('barbers')
        .select('*')
        .order('name', { ascending: true });

      if (!bErr && bData && bData.length > 0) {
        setBarbers(bData as Barber[]);
      }

      // 4. Fetch queue entries (using public_queue_entries or queue_entries)
      const { data: qData, error: qErr } = await supabase
        .from('queue_entries')
        .select('*')
        .in('status', ['waiting', 'called', 'in_chair'])
        .order('joined_at', { ascending: true });

      if (!qErr && qData) {
        setQueueEntries(qData as QueueEntry[]);
        setIsLive(true);
      } else {
        setIsLive(false);
      }
    } catch (err) {
      console.warn('Error fetching queue data from Supabase:', err);
      setIsLive(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    // 5-second polling fallback
    const interval = setInterval(() => {
      fetchData();
    }, 5000);

    // Supabase Realtime subscription
    let subscriptionChannel: ReturnType<typeof supabase.channel> | null = null;
    if (isSupabaseConfigured) {
      subscriptionChannel = supabase
        .channel('all1-queue-channel')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'queue_entries' },
          () => {
            fetchData();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'barbers' },
          () => {
            fetchData();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'settings' },
          () => {
            fetchData();
          }
        )
        .subscribe((status) => {
          setIsLive(status === 'SUBSCRIBED');
        });
    }

    return () => {
      clearInterval(interval);
      if (subscriptionChannel) {
        supabase.removeChannel(subscriptionChannel);
      }
    };
  }, [fetchData]);

  // Check if online tokens are paused:
  // - settings.online_tokens_on === false
  // - Current time within 20 min before close_time (20:40–21:00)
  // - Salon closed (before 10:00 or after 21:00)
  const { isOnlineTokensPaused, pauseReason } = useMemo(() => {
    if (!settings?.online_tokens_on) {
      return {
        isOnlineTokensPaused: true,
        pauseReason: 'Online tokens are paused by reception.',
      };
    }

    // Check time in Asia/Kolkata
    try {
      const now = new Date();
      const kolkataTimeStr = now.toLocaleTimeString('en-GB', {
        timeZone: 'Asia/Kolkata',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
      }); // e.g. "20:45"

      const [hours, mins] = kolkataTimeStr.split(':').map(Number);
      const currentMinutesOfDay = hours * 60 + mins;

      const [openH, openM] = (settings.open_time || '10:00').split(':').map(Number);
      const openMinutesOfDay = openH * 60 + openM;

      const [closeH, closeM] = (settings.close_time || '21:00').split(':').map(Number);
      const closeMinutesOfDay = closeH * 60 + closeM;
      const cutoffMinutesOfDay = closeMinutesOfDay - 20;

      if (currentMinutesOfDay < openMinutesOfDay) {
        return {
          isOnlineTokensPaused: true,
          pauseReason: `Salon opens at ${settings.open_time}. Online tokens are paused.`,
        };
      }

      if (currentMinutesOfDay >= cutoffMinutesOfDay && currentMinutesOfDay < closeMinutesOfDay) {
        return {
          isOnlineTokensPaused: true,
          pauseReason: 'Online tokens stop 20 minutes before closing (closes 9 PM). Walk-ins welcome.',
        };
      }

      if (currentMinutesOfDay >= closeMinutesOfDay) {
        return {
          isOnlineTokensPaused: true,
          pauseReason: `Salon closed at ${settings.close_time}. Walk-ins resume tomorrow at 10 AM.`,
        };
      }
    } catch (e) {
      console.warn('Timezone calculation error:', e);
    }

    return { isOnlineTokensPaused: false, pauseReason: '' };
  }, [settings]);

  // Waiting count
  const waitingCount = useMemo(() => {
    return queueEntries.filter((e) => e.status === 'waiting').length;
  }, [queueEntries]);

  // Barbers working & on duty
  const activeWorkingBarbers = useMemo(() => {
    return barbers.filter((b) => b.working_today && !b.on_break);
  }, [barbers]);

  // Overall wait minutes calculation:
  // (sum of minutes of everyone ahead + time left on current chairs) / active barbers
  const overallWaitMinutes = useMemo(() => {
    if (activeWorkingBarbers.length === 0) return 45;

    const sumWaiting = queueEntries
      .filter((e) => e.status === 'waiting')
      .reduce((sum, e) => sum + (e.total_minutes || 30), 0);

    const sumInChair = queueEntries
      .filter((e) => e.status === 'in_chair')
      .reduce((sum, e) => {
        if (!e.started_at) return sum + 20;
        const elapsed = Math.floor((Date.now() - new Date(e.started_at).getTime()) / 60000);
        return sum + Math.max(5, (e.total_minutes || 30) - elapsed);
      }, 0);

    const totalMinutes = sumWaiting + sumInChair;
    return Math.max(5, Math.ceil(totalMinutes / activeWorkingBarbers.length));
  }, [queueEntries, activeWorkingBarbers]);

  // Wait calculation for a specific barber
  const getBarberWaitMinutes = useCallback(
    (barberId: string): number => {
      const barber = barbers.find((b) => b.id === barberId);
      if (!barber || !barber.working_today || barber.on_break) {
        return 0;
      }

      // In chair for this barber
      const inChairEntry = queueEntries.find(
        (e) => e.status === 'in_chair' && e.assigned_barber_id === barberId
      );
      let chairRemaining = 0;
      if (inChairEntry) {
        if (inChairEntry.started_at) {
          const elapsed = Math.floor((Date.now() - new Date(inChairEntry.started_at).getTime()) / 60000);
          chairRemaining = Math.max(5, inChairEntry.total_minutes - elapsed);
        } else {
          chairRemaining = 20;
        }
      }

      // Waiting customers requesting this barber or called
      const waitingMinutes = queueEntries
        .filter(
          (e) =>
            (e.status === 'waiting' && e.preferred_barber_id === barberId) ||
            (e.status === 'called' && e.assigned_barber_id === barberId)
        )
        .reduce((sum, e) => sum + e.total_minutes, 0);

      const total = chairRemaining + waitingMinutes;
      return total;
    },
    [barbers, queueEntries]
  );

  // Status calculation for barber (Working / Free / On break)
  const getBarberStatus = useCallback(
    (barber: Barber): 'Working' | 'Free' | 'On break' => {
      if (!barber.working_today || barber.on_break) return 'On break';
      const isBusy = queueEntries.some(
        (e) =>
          (e.status === 'in_chair' || e.status === 'called') &&
          e.assigned_barber_id === barber.id
      );
      return isBusy ? 'Working' : 'Free';
    },
    [queueEntries]
  );

  // Take online token
  const takeOnlineToken = async (
    customerName: string,
    phone: string,
    serviceIds: string[],
    preferredBarberId?: string | null
  ): Promise<{ tokenId: string; isExisting?: boolean }> => {
    const cleanPhone = phone.replace(/\D/g, '');

    // 1. Check if user already has an active token in state
    const existing = queueEntries.find(
      (e) =>
        e.phone === cleanPhone &&
        (e.status === 'waiting' || e.status === 'called' || e.status === 'in_chair')
    );

    if (existing) {
      return { tokenId: existing.id, isExisting: true };
    }

    if (isSupabaseConfigured) {
      // Call Postgres RPC take_token
      const { data, error } = await supabase.rpc('take_token', {
        p_customer_name: customerName.trim(),
        p_phone: cleanPhone,
        p_service_ids: serviceIds,
        p_preferred_barber_id: preferredBarberId || null,
      });

      if (error) {
        // If error says active token exists, try to find it
        if (error.message.includes('already exists')) {
          const active = await findActiveTokenByPhone(cleanPhone);
          if (active) {
            return { tokenId: active.id, isExisting: true };
          }
        }
        throw new Error(error.message);
      }

      await fetchData();
      return { tokenId: data.id };
    } else {
      // Offline mock token generation
      const mockServices = services.filter((s) => serviceIds.includes(s.id));
      const totalMinutes = mockServices.reduce((sum, s) => sum + s.minutes, 0);
      const totalPrice = mockServices.reduce((sum, s) => sum + s.price, 0);
      const nextNumber = queueEntries.length + 1;

      const newEntry: QueueEntry = {
        id: `mock-${Date.now()}`,
        token_number: nextNumber,
        token_prefix: 'O',
        token_date: new Date().toISOString().split('T')[0],
        customer_name: customerName.trim(),
        phone: cleanPhone,
        service_ids: serviceIds,
        total_minutes: totalMinutes,
        total_price: totalPrice,
        preferred_barber_id: preferredBarberId || null,
        status: 'waiting',
        late_extension_used: false,
        joined_at: new Date().toISOString(),
      };

      const updated = [...queueEntries, newEntry];
      setQueueEntries(updated);
      saveLocalQueue(updated);
      return { tokenId: newEntry.id };
    }
  };

  // Find active token by phone
  const findActiveTokenByPhone = async (phone: string): Promise<QueueEntry | null> => {
    const cleanPhone = phone.replace(/\D/g, '');

    if (isSupabaseConfigured) {
      const { data, error } = await supabase.rpc('find_active_token', {
        p_phone: cleanPhone,
      });

      if (!error && data) {
        return data as QueueEntry;
      }
      return null;
    } else {
      const match = queueEntries.find(
        (e) =>
          e.phone === cleanPhone &&
          (e.status === 'waiting' || e.status === 'called' || e.status === 'in_chair')
      );
      return match || null;
    }
  };

  // Get token by ID
  const getTokenById = async (tokenId: string): Promise<QueueEntry | null> => {
    // Check in-memory list first
    const inMem = queueEntries.find((e) => e.id === tokenId);
    if (inMem) return inMem;

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('queue_entries')
        .select('*')
        .eq('id', tokenId)
        .maybeSingle();

      if (!error && data) {
        return data as QueueEntry;
      }
      return null;
    } else {
      const allLocal = getLocalQueue();
      return allLocal.find((e) => e.id === tokenId) || null;
    }
  };

  // Extend running late (+5 min once)
  const extendRunningLate = async (tokenId: string): Promise<boolean> => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.rpc('extend_late', {
        p_token_id: tokenId,
      });
      if (error) {
        throw new Error(error.message);
      }
      await fetchData();
      return Boolean(data);
    } else {
      const all = getLocalQueue();
      const updated = all.map((e) =>
        e.id === tokenId ? { ...e, late_extension_used: true } : e
      );
      saveLocalQueue(updated);
      setQueueEntries(updated.filter((e) => ['waiting', 'called', 'in_chair'].includes(e.status)));
      return true;
    }
  };

  // Release customer token
  const releaseCustomerToken = async (tokenId: string): Promise<boolean> => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.rpc('release_token', {
        p_token_id: tokenId,
      });
      if (error) {
        throw new Error(error.message);
      }
      await fetchData();
      return Boolean(data);
    } else {
      const all = getLocalQueue();
      const updated = all.map((e) =>
        e.id === tokenId ? { ...e, status: 'cancelled' as const } : e
      );
      saveLocalQueue(updated);
      setQueueEntries(updated.filter((e) => ['waiting', 'called', 'in_chair'].includes(e.status)));
      return true;
    }
  };

  // Call Next Customer for a barber (strictly uses call_next Postgres function)
  const callNextCustomer = async (barberId: string): Promise<QueueEntry | null> => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.rpc('call_next', {
        p_barber_id: barberId,
      });
      if (error) {
        throw new Error(error.message);
      }
      await fetchData();
      return (data as QueueEntry) || null;
    } else {
      // Offline mock implementation replicating call_next SQL function logic:
      // Find earliest waiting customer where preferred_barber_id is barberId or null
      const all = getLocalQueue();
      const eligibleIndex = all.findIndex(
        (e) =>
          e.status === 'waiting' &&
          (e.preferred_barber_id === barberId || !e.preferred_barber_id)
      );

      if (eligibleIndex === -1) {
        return null;
      }

      const updated = [...all];
      updated[eligibleIndex] = {
        ...updated[eligibleIndex],
        status: 'called',
        assigned_barber_id: barberId,
        called_at: new Date().toISOString(),
      };

      saveLocalQueue(updated);
      setQueueEntries(updated.filter((e) => ['waiting', 'called', 'in_chair'].includes(e.status)));
      return updated[eligibleIndex];
    }
  };

  // Add Walk-in customer
  const addWalkinCustomer = async (
    name: string,
    phone: string,
    serviceIds: string[],
    preferredBarberId?: string | null
  ): Promise<QueueEntry> => {
    const cleanPhone = phone.replace(/\D/g, '');

    if (isSupabaseConfigured) {
      const { data, error } = await supabase.rpc('add_walkin', {
        p_customer_name: name.trim(),
        p_phone: cleanPhone,
        p_service_ids: serviceIds,
        p_preferred_barber_id: preferredBarberId || null,
      });

      if (error) {
        throw new Error(error.message);
      }
      await fetchData();
      return data as QueueEntry;
    } else {
      const mockServices = services.filter((s) => serviceIds.includes(s.id));
      const totalMinutes = mockServices.reduce((sum, s) => sum + s.minutes, 0);
      const totalPrice = mockServices.reduce((sum, s) => sum + s.price, 0);
      const nextNumber = queueEntries.length + 1;

      const newEntry: QueueEntry = {
        id: `mock-walkin-${Date.now()}`,
        token_number: nextNumber,
        token_prefix: 'W',
        token_date: new Date().toISOString().split('T')[0],
        customer_name: name.trim(),
        phone: cleanPhone,
        service_ids: serviceIds,
        total_minutes: totalMinutes,
        total_price: totalPrice,
        preferred_barber_id: preferredBarberId || null,
        status: 'waiting',
        late_extension_used: false,
        joined_at: new Date().toISOString(),
      };

      const all = getLocalQueue();
      const updated = [...all, newEntry];
      saveLocalQueue(updated);
      setQueueEntries(updated.filter((e) => ['waiting', 'called', 'in_chair'].includes(e.status)));
      return newEntry;
    }
  };

  // Mark customer as No-Show
  const markNoShowCustomer = async (tokenId: string): Promise<boolean> => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.rpc('mark_no_show', {
        p_token_id: tokenId,
      });
      if (error) {
        throw new Error(error.message);
      }
      await fetchData();
      return Boolean(data);
    } else {
      const all = getLocalQueue();
      const updated = all.map((e) =>
        e.id === tokenId ? { ...e, status: 'no_show' as const } : e
      );
      saveLocalQueue(updated);
      setQueueEntries(updated.filter((e) => ['waiting', 'called', 'in_chair'].includes(e.status)));
      return true;
    }
  };

  // Toggle online tokens on/off
  const toggleOnlineTokens = async (enabled: boolean): Promise<void> => {
    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('settings')
        .update({ online_tokens_on: enabled })
        .eq('id', 1);

      if (error) {
        throw new Error(error.message);
      }
      await fetchData();
    } else {
      if (settings) {
        setSettings({ ...settings, online_tokens_on: enabled });
      }
    }
  };

  return (
    <QueueContext.Provider
      value={{
        services,
        barbers,
        settings,
        queueEntries,
        loading,
        isLive,
        waitingCount,
        overallWaitMinutes,
        isOnlineTokensPaused,
        pauseReason,
        getBarberWaitMinutes,
        getBarberStatus,
        takeOnlineToken,
        findActiveTokenByPhone,
        getTokenById,
        extendRunningLate,
        releaseCustomerToken,
        callNextCustomer,
        addWalkinCustomer,
        markNoShowCustomer,
        toggleOnlineTokens,
        refreshData: fetchData,
      }}
    >
      {children}
    </QueueContext.Provider>
  );
};

export const useQueue = (): QueueContextType => {
  const context = useContext(QueueContext);
  if (!context) {
    throw new Error('useQueue must be used within a QueueProvider');
  }
  return context;
};
