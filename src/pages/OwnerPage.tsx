import React, { useState, useEffect, useMemo } from 'react';
import { Header } from '../components/common/Header';
import { Footer } from '../components/common/Footer';
import { StatsChart } from '../components/queue/StatsChart';
import { useI18n } from '../lib/i18n';
import { useQueue } from '../context/QueueContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Service, Barber, StaffRole } from '../types';
import {
  Scissors,
  Users,
  Shield,
  BarChart3,
  CheckCircle,
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Settings as SettingsIcon,
} from 'lucide-react';

interface StaffItem {
  email: string;
  role: StaffRole;
}

export const OwnerPage: React.FC = () => {
  const { t } = useI18n();
  const {
    services,
    barbers,
    settings,
    queueEntries,
    isLive,
    updateService,
    createService,
    toggleServiceActive,
    updateBarber,
    updateSettings,
  } = useQueue();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'analytics' | 'services' | 'barbers' | 'staff' | 'settings'>('analytics');

  // Staff Table State
  const [staffList, setStaffList] = useState<StaffItem[]>([
    { email: 'reception@all1salon.com', role: 'receptionist' },
    { email: 'owner@all1salon.com', role: 'owner' },
    { email: 'barber@all1salon.com', role: 'barber' },
  ]);
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<StaffRole>('receptionist');

  // Service Edit/Add Modal State
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [serviceNameEn, setServiceNameEn] = useState('');
  const [serviceNameGu, setServiceNameGu] = useState('');
  const [serviceMinutes, setServiceMinutes] = useState(30);
  const [servicePrice, setServicePrice] = useState(300);
  const [serviceIcon, setServiceIcon] = useState('scissors');

  // Salon settings form state
  const [openTime, setOpenTime] = useState(settings?.open_time || '10:00');
  const [closeTime, setCloseTime] = useState(settings?.close_time || '21:00');
  const [onlineTokensOn, setOnlineTokensOn] = useState(settings?.online_tokens_on !== false);

  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Sync settings when loaded
  useEffect(() => {
    if (settings) {
      setOpenTime(settings.open_time || '10:00');
      setCloseTime(settings.close_time || '21:00');
      setOnlineTokensOn(settings.online_tokens_on !== false);
    }
  }, [settings]);

  // Load staff records from Supabase if configured
  useEffect(() => {
    const fetchStaff = async () => {
      if (!isSupabaseConfigured) return;
      try {
        const { data, error } = await supabase.from('staff').select('email, role');
        if (!error && data) {
          setStaffList(data as StaffItem[]);
        }
      } catch (e) {
        console.warn('Error fetching staff records:', e);
      }
    };
    fetchStaff();
  }, []);

  // Stats Calculations
  const stats = useMemo(() => {
    const servedCount = queueEntries.filter((e) => e.status === 'done').length;
    const noShowCount = queueEntries.filter((e) => e.status === 'no_show').length;

    // Average wait
    const waitingTokens = queueEntries.filter((e) => e.status === 'waiting' || e.status === 'called');
    const avgWait =
      waitingTokens.length > 0
        ? Math.round(
            waitingTokens.reduce((sum, e) => sum + (e.total_minutes || 30), 0) /
              Math.max(1, barbers.filter((b) => b.working_today).length)
          )
        : 25;

    return {
      servedCount,
      noShowCount,
      avgWait,
      totalToday: queueEntries.length,
    };
  }, [queueEntries, barbers]);

  // Handle Add / Edit Service Modal Open
  const openEditModal = (service: Service) => {
    setEditingService(service);
    setServiceNameEn(service.name_en);
    setServiceNameGu(service.name_gu);
    setServiceMinutes(service.minutes);
    setServicePrice(service.price);
    setServiceIcon(service.icon);
    setIsAddServiceOpen(true);
  };

  const openNewModal = () => {
    setEditingService(null);
    setServiceNameEn('');
    setServiceNameGu('');
    setServiceMinutes(30);
    setServicePrice(300);
    setServiceIcon('scissors');
    setIsAddServiceOpen(true);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!serviceNameEn.trim() || !serviceNameGu.trim()) {
      setErrorMsg('Please enter both English and Gujarati service names.');
      return;
    }

    try {
      if (editingService) {
        await updateService({
          ...editingService,
          name_en: serviceNameEn.trim(),
          name_gu: serviceNameGu.trim(),
          minutes: Number(serviceMinutes),
          price: Number(servicePrice),
          icon: serviceIcon,
        });
        setFeedbackMsg('Service updated successfully.');
      } else {
        await createService({
          name_en: serviceNameEn.trim(),
          name_gu: serviceNameGu.trim(),
          minutes: Number(serviceMinutes),
          price: Number(servicePrice),
          icon: serviceIcon,
          active: true,
        });
        setFeedbackMsg('New service created.');
      }
      setIsAddServiceOpen(false);
      setTimeout(() => setFeedbackMsg(''), 3000);
    } catch (err: unknown) {
      setErrorMsg((err as Error)?.message || 'Failed to save service.');
    }
  };

  // Handle Service Switch On/Off
  const handleToggleService = async (service: Service) => {
    try {
      await toggleServiceActive(service.id, !service.active);
      setFeedbackMsg(`Service "${service.name_en}" ${!service.active ? 'activated' : 'deactivated'}.`);
      setTimeout(() => setFeedbackMsg(''), 3000);
    } catch (err: unknown) {
      setErrorMsg((err as Error)?.message || 'Failed to toggle service.');
    }
  };

  // Handle Barber updates (working_today, email)
  const handleToggleBarberWork = async (barber: Barber) => {
    try {
      await updateBarber(barber.id, { working_today: !barber.working_today });
      setFeedbackMsg(`Barber ${barber.name} status updated.`);
      setTimeout(() => setFeedbackMsg(''), 3000);
    } catch (err: unknown) {
      setErrorMsg((err as Error)?.message || 'Failed to update barber.');
    }
  };

  const handleBarberEmailChange = async (barberId: string, email: string) => {
    try {
      await updateBarber(barberId, { email: email.trim().toLowerCase() });
      setFeedbackMsg('Barber linked email updated.');
      setTimeout(() => setFeedbackMsg(''), 3000);
    } catch (err: unknown) {
      setErrorMsg((err as Error)?.message || 'Failed to update email.');
    }
  };

  // Staff Management
  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffEmail.trim() || !newStaffEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    const cleanEmail = newStaffEmail.trim().toLowerCase();
    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase.from('staff').upsert([
          { email: cleanEmail, role: newStaffRole },
        ]);
        if (error) throw new Error(error.message);
      }
      setStaffList((prev) => [
        ...prev.filter((s) => s.email !== cleanEmail),
        { email: cleanEmail, role: newStaffRole },
      ]);
      setNewStaffEmail('');
      setFeedbackMsg(`Added ${cleanEmail} as ${newStaffRole}.`);
      setTimeout(() => setFeedbackMsg(''), 3000);
    } catch (err: unknown) {
      setErrorMsg((err as Error)?.message || 'Failed to add staff.');
    }
  };

  const handleRemoveStaff = async (email: string) => {
    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase.from('staff').delete().eq('email', email);
        if (error) throw new Error(error.message);
      }
      setStaffList((prev) => prev.filter((s) => s.email !== email));
      setFeedbackMsg(`Removed ${email} from staff.`);
      setTimeout(() => setFeedbackMsg(''), 3000);
    } catch (err: unknown) {
      setErrorMsg((err as Error)?.message || 'Failed to remove staff.');
    }
  };

  // Settings Save
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSettings({
        open_time: openTime,
        close_time: closeTime,
        online_tokens_on: onlineTokensOn,
      });
      setFeedbackMsg('Salon settings saved successfully.');
      setTimeout(() => setFeedbackMsg(''), 3000);
    } catch (err: unknown) {
      setErrorMsg((err as Error)?.message || 'Failed to save settings.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-all1-navy text-white">
      <Header theme="dark" isLive={isLive} />

      {/* Owner Header */}
      <section className="bg-all1-deep border-b border-all1-cobalt/20 px-6 py-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-heading font-extrabold text-white flex items-center gap-2.5">
              <Shield className="w-6 h-6 text-all1-coral" />
              <span>{t('owner.title')}</span>
            </h1>
            <p className="text-xs text-all1-fog mt-0.5">
              Master administration: manage services, staff, working barbers, and analytics.
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {[
              { id: 'analytics', label: t('owner.tabAnalytics'), icon: BarChart3 },
              { id: 'services', label: t('owner.tabServices'), icon: Scissors },
              { id: 'barbers', label: t('owner.tabBarbers'), icon: Users },
              { id: 'staff', label: t('owner.tabStaff'), icon: Shield },
              { id: 'settings', label: t('owner.openingHours'), icon: SettingsIcon },
            ].map((tab) => {
              const IconComp = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`px-3 py-2 rounded-btn font-semibold flex items-center gap-1.5 transition-all tap-target whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-all1-cobalt text-white shadow-sm'
                      : 'bg-all1-navy text-all1-fog hover:text-white border border-all1-cobalt/20'
                  }`}
                >
                  <IconComp className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Body */}
      <main className="flex-1 max-w-6xl mx-auto w-full p-4 sm:p-6 space-y-6">
        {/* Feedback Alerts */}
        {feedbackMsg && (
          <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/30 rounded-btn text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{feedbackMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="p-3.5 bg-all1-rose/15 border border-all1-rose/30 rounded-btn text-xs text-all1-rose flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 1. ANALYTICS & STATS TAB */}
        {activeTab === 'analytics' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-all1-deep p-5 rounded-card border border-all1-cobalt/20 space-y-1">
                <span className="text-xs text-all1-fog block font-medium uppercase tracking-wider">
                  {t('owner.todayServed')}
                </span>
                <span className="text-3xl font-mono font-extrabold text-all1-lime">
                  {stats.servedCount}
                </span>
                <p className="text-[11px] text-all1-fog">Finished services</p>
              </div>

              <div className="bg-all1-deep p-5 rounded-card border border-all1-cobalt/20 space-y-1">
                <span className="text-xs text-all1-fog block font-medium uppercase tracking-wider">
                  {t('owner.avgWait')}
                </span>
                <span className="text-3xl font-mono font-extrabold text-all1-aqua">
                  {stats.avgWait} min
                </span>
                <p className="text-[11px] text-all1-fog">Based on chairs on duty</p>
              </div>

              <div className="bg-all1-deep p-5 rounded-card border border-all1-cobalt/20 space-y-1">
                <span className="text-xs text-all1-fog block font-medium uppercase tracking-wider">
                  {t('owner.noShows')}
                </span>
                <span className="text-3xl font-mono font-extrabold text-all1-rose">
                  {stats.noShowCount}
                </span>
                <p className="text-[11px] text-all1-fog">Turn passed & absent</p>
              </div>

              <div className="bg-all1-deep p-5 rounded-card border border-all1-cobalt/20 space-y-1">
                <span className="text-xs text-all1-fog block font-medium uppercase tracking-wider">
                  Online Tokens
                </span>
                <span
                  className={`text-2xl font-mono font-extrabold block ${
                    onlineTokensOn ? 'text-all1-lime' : 'text-all1-sun'
                  }`}
                >
                  {onlineTokensOn ? 'ACTIVE' : 'PAUSED'}
                </span>
                <p className="text-[11px] text-all1-fog">Closes 20m before 9 PM</p>
              </div>
            </div>

            {/* Busiest Hour Mini Chart */}
            <div className="bg-all1-deep rounded-card p-6 border border-all1-cobalt/20 space-y-4">
              <h2 className="text-base font-heading font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-all1-coral" />
                <span>{t('owner.busiestHour')}</span>
              </h2>
              <StatsChart queueEntries={queueEntries} />
            </div>
          </div>
        )}

        {/* 2. SERVICES TAB (Add, Edit, Switch Off) */}
        {activeTab === 'services' && (
          <div className="bg-all1-deep rounded-card p-6 border border-all1-cobalt/20 space-y-5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-heading font-bold text-white">
                  {t('owner.tabServices')}
                </h2>
                <p className="text-xs text-all1-fog">
                  Switched-off services automatically disappear from the customer Get Token page.
                </p>
              </div>
              <button
                type="button"
                onClick={openNewModal}
                className="px-4 py-2 bg-all1-coral text-white font-heading font-bold rounded-btn hover:bg-opacity-90 transition tap-target text-xs flex items-center gap-1.5 shadow-sm shadow-all1-coral/30"
              >
                <Plus className="w-4 h-4" />
                <span>{t('owner.addService')}</span>
              </button>
            </div>

            {/* Services Table */}
            <div className="divide-y divide-all1-cobalt/15 overflow-x-auto">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="py-3.5 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-all1-navy border border-all1-cobalt/30 text-all1-aqua flex items-center justify-center shrink-0">
                      <Scissors className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-heading font-bold text-sm text-white truncate">
                          {service.name_en} / {service.name_gu}
                        </h4>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            service.active
                              ? 'bg-all1-lime/20 text-all1-lime border border-all1-lime/30'
                              : 'bg-gray-800 text-gray-400 border border-gray-700'
                          }`}
                        >
                          {service.active ? t('owner.activeStatus') : t('owner.inactiveStatus')}
                        </span>
                      </div>
                      <p className="text-xs text-all1-fog mt-0.5 font-medium">
                        {service.minutes} min • <span className="font-mono text-white font-bold">₹{service.price}</span>
                      </p>
                    </div>
                  </div>

                  {/* Actions: Switch Off Toggle & Edit */}
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleService(service)}
                      className={`px-3 py-1.5 rounded-btn text-xs font-semibold flex items-center gap-1.5 transition-colors tap-target ${
                        service.active
                          ? 'bg-all1-lime/15 text-all1-lime border border-all1-lime/30 hover:bg-all1-lime/25'
                          : 'bg-all1-navy text-gray-400 border border-gray-700 hover:text-white'
                      }`}
                      title="Toggle active visibility on booking screens"
                    >
                      {service.active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                      <span>{service.active ? 'Active' : 'Off'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openEditModal(service)}
                      className="p-2 bg-all1-navy rounded-btn border border-all1-cobalt/30 text-all1-fog hover:text-white tap-target"
                      title="Edit Service"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. BARBERS TAB (Who works today, linked email) */}
        {activeTab === 'barbers' && (
          <div className="bg-all1-deep rounded-card p-6 border border-all1-cobalt/20 space-y-5 animate-in fade-in duration-150">
            <div>
              <h2 className="text-lg font-heading font-bold text-white">
                {t('owner.tabBarbers')}
              </h2>
              <p className="text-xs text-all1-fog">
                Toggle who is working today and link Google emails for barber screen authentication.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {barbers.map((b) => (
                <div
                  key={b.id}
                  className="bg-all1-navy p-5 rounded-2xl border border-all1-cobalt/20 space-y-4 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-hero-gradient text-white font-heading font-extrabold text-lg flex items-center justify-center shadow-xs">
                        {b.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-heading font-bold text-base text-white">
                          {b.name}
                        </h3>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            b.working_today
                              ? 'bg-all1-lime/20 text-all1-lime'
                              : 'bg-gray-800 text-gray-500'
                          }`}
                        >
                          {b.working_today ? t('owner.workingToday') : t('owner.offDuty')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Working Today Switch */}
                  <div className="pt-2 border-t border-all1-cobalt/15 flex items-center justify-between text-xs">
                    <span className="text-all1-fog font-medium">{t('owner.workingToday')}:</span>
                    <button
                      type="button"
                      onClick={() => handleToggleBarberWork(b)}
                      className={`px-3 py-1 rounded-full font-bold text-xs transition-colors tap-target ${
                        b.working_today
                          ? 'bg-all1-lime text-all1-navy'
                          : 'bg-gray-800 text-gray-400'
                      }`}
                    >
                      {b.working_today ? 'YES' : 'OFF'}
                    </button>
                  </div>

                  {/* Linked Google Email */}
                  <div>
                    <label className="block text-[11px] font-semibold text-all1-fog mb-1">
                      Linked Google Email
                    </label>
                    <input
                      type="email"
                      defaultValue={b.email || ''}
                      onBlur={(e) => handleBarberEmailChange(b.id, e.target.value)}
                      placeholder="barber@gmail.com"
                      className="w-full bg-all1-deep border border-all1-cobalt/30 rounded-btn px-3 py-2 text-xs font-mono text-white outline-none focus:border-all1-aqua"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. STAFF ACCESS LIST (Allowlist with roles) */}
        {activeTab === 'staff' && (
          <div className="bg-all1-deep rounded-card p-6 border border-all1-cobalt/20 space-y-6 animate-in fade-in duration-150">
            <div>
              <h2 className="text-lg font-heading font-bold text-white">
                {t('owner.tabStaff')}
              </h2>
              <p className="text-xs text-all1-fog">
                Allowlisted Google accounts permitted to log in via Staff Login.
              </p>
            </div>

            {/* Add Staff Member Form */}
            <form onSubmit={handleAddStaff} className="p-4 bg-all1-navy rounded-2xl border border-all1-cobalt/20 flex flex-col sm:flex-row items-end gap-3">
              <div className="flex-1 w-full">
                <label className="block text-xs font-semibold text-all1-fog mb-1">
                  {t('owner.staffEmail')}
                </label>
                <input
                  type="email"
                  value={newStaffEmail}
                  onChange={(e) => setNewStaffEmail(e.target.value)}
                  placeholder="staff@gmail.com"
                  className="w-full bg-all1-deep border border-all1-cobalt/30 rounded-btn px-3 py-2 text-xs font-mono text-white outline-none focus:border-all1-aqua"
                />
              </div>

              <div className="w-full sm:w-44">
                <label className="block text-xs font-semibold text-all1-fog mb-1">
                  {t('owner.staffRole')}
                </label>
                <select
                  value={newStaffRole}
                  onChange={(e) => setNewStaffRole(e.target.value as StaffRole)}
                  className="w-full bg-all1-deep border border-all1-cobalt/30 rounded-btn px-3 py-2 text-xs text-white outline-none focus:border-all1-aqua"
                >
                  <option value="receptionist">Receptionist</option>
                  <option value="owner">Owner</option>
                  <option value="barber">Barber</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-5 py-2.5 bg-all1-cobalt text-white font-medium rounded-btn hover:bg-opacity-90 transition tap-target text-xs shrink-0 flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>{t('owner.addStaff')}</span>
              </button>
            </form>

            {/* Staff List Table */}
            <div className="divide-y divide-all1-cobalt/15">
              {staffList.map((st) => (
                <div key={st.email} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-mono font-bold text-sm text-white">{st.email}</p>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-all1-cobalt/20 text-all1-aqua mt-1 inline-block">
                      {st.role}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveStaff(st.email)}
                    className="p-2 text-all1-fog hover:text-all1-rose rounded-btn tap-target transition-colors"
                    title={t('owner.deleteStaff')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. SETTINGS & OPENING HOURS TAB */}
        {activeTab === 'settings' && (
          <div className="bg-all1-deep rounded-card p-6 border border-all1-cobalt/20 space-y-5 animate-in fade-in duration-150">
            <div>
              <h2 className="text-lg font-heading font-bold text-white">
                {t('owner.openingHours')}
              </h2>
              <p className="text-xs text-all1-fog">
                {t('owner.salonHoursDesc')}
              </p>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4 max-w-md">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-all1-fog mb-1">
                    {t('owner.openTime')}
                  </label>
                  <input
                    type="time"
                    value={openTime}
                    onChange={(e) => setOpenTime(e.target.value)}
                    className="w-full bg-all1-navy border border-all1-cobalt/30 rounded-btn px-3 py-2 text-xs font-mono text-white outline-none focus:border-all1-aqua"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-all1-fog mb-1">
                    {t('owner.closeTime')}
                  </label>
                  <input
                    type="time"
                    value={closeTime}
                    onChange={(e) => setCloseTime(e.target.value)}
                    className="w-full bg-all1-navy border border-all1-cobalt/30 rounded-btn px-3 py-2 text-xs font-mono text-white outline-none focus:border-all1-aqua"
                  />
                </div>
              </div>

              {/* Online Tokens Switch */}
              <div className="p-4 bg-all1-navy rounded-xl border border-all1-cobalt/20 flex items-center justify-between">
                <div>
                  <p className="font-heading font-semibold text-sm text-white">Online Tokens</p>
                  <p className="text-[11px] text-all1-fog">Allow customers to take tokens remotely from phones</p>
                </div>
                <button
                  type="button"
                  onClick={() => setOnlineTokensOn((prev) => !prev)}
                  className={`px-3 py-1 rounded-full font-bold text-xs transition-colors tap-target ${
                    onlineTokensOn ? 'bg-all1-lime text-all1-navy' : 'bg-all1-sun text-all1-navy'
                  }`}
                >
                  {onlineTokensOn ? 'ENABLED' : 'PAUSED'}
                </button>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-all1-cobalt text-white font-medium rounded-btn hover:bg-opacity-90 transition tap-target text-sm flex items-center justify-center gap-2 shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>{t('owner.save')}</span>
              </button>
            </form>
          </div>
        )}
      </main>

      {/* Add / Edit Service Modal */}
      {isAddServiceOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in"
        >
          <div className="bg-all1-deep rounded-card max-w-md w-full p-6 border border-all1-cobalt/30 text-white shadow-2xl relative">
            <button
              onClick={() => setIsAddServiceOpen(false)}
              className="absolute top-4 right-4 text-all1-fog hover:text-white p-1 tap-target"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-heading font-bold text-white mb-4">
              {editingService ? t('owner.editService') : t('owner.addService')}
            </h3>

            <form onSubmit={handleSaveService} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-all1-fog mb-1">
                  Service Name (English)
                </label>
                <input
                  type="text"
                  value={serviceNameEn}
                  onChange={(e) => setServiceNameEn(e.target.value)}
                  placeholder="e.g. Haircut"
                  className="w-full bg-all1-navy border border-all1-cobalt/30 rounded-btn px-3 py-2 text-xs text-white outline-none focus:border-all1-aqua"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-all1-fog mb-1">
                  Service Name (Gujarati)
                </label>
                <input
                  type="text"
                  value={serviceNameGu}
                  onChange={(e) => setServiceNameGu(e.target.value)}
                  placeholder="e.g. હેરકટ"
                  className="w-full bg-all1-navy border border-all1-cobalt/30 rounded-btn px-3 py-2 text-xs text-white font-gujarati outline-none focus:border-all1-aqua"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-all1-fog mb-1">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={180}
                    value={serviceMinutes}
                    onChange={(e) => setServiceMinutes(Number(e.target.value))}
                    className="w-full bg-all1-navy border border-all1-cobalt/30 rounded-btn px-3 py-2 text-xs font-mono text-white outline-none focus:border-all1-aqua"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-all1-fog mb-1">
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={servicePrice}
                    onChange={(e) => setServicePrice(Number(e.target.value))}
                    className="w-full bg-all1-navy border border-all1-cobalt/30 rounded-btn px-3 py-2 text-xs font-mono text-white outline-none focus:border-all1-aqua"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-all1-fog mb-1">
                  Icon
                </label>
                <select
                  value={serviceIcon}
                  onChange={(e) => setServiceIcon(e.target.value)}
                  className="w-full bg-all1-navy border border-all1-cobalt/30 rounded-btn px-3 py-2 text-xs text-white outline-none focus:border-all1-aqua"
                >
                  <option value="scissors">Scissors (Hair / Beard)</option>
                  <option value="sparkles">Sparkles (Facial)</option>
                  <option value="droplets">Droplets (Wash)</option>
                  <option value="hand">Hand (Massage)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddServiceOpen(false)}
                  className="flex-1 py-2.5 bg-all1-navy border border-all1-cobalt/20 text-all1-fog rounded-btn text-xs font-medium tap-target"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-all1-coral text-white font-heading font-bold rounded-btn hover:bg-opacity-90 transition tap-target text-xs shadow-md shadow-all1-coral/30"
                >
                  {t('owner.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer theme="dark" />
    </div>
  );
};
