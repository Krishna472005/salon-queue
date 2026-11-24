export type StaffRole = 'owner' | 'receptionist' | 'barber';

export type TokenStatus = 'waiting' | 'called' | 'in_chair' | 'done' | 'cancelled' | 'no_show';

export interface Service {
  id: string;
  name_en: string;
  name_gu: string;
  minutes: number;
  price: number;
  icon: string;
  active: boolean;
}

export interface Barber {
  id: string;
  name: string;
  photo_url?: string | null;
  email?: string | null;
  working_today: boolean;
  on_break: boolean;
}

export interface Settings {
  id: number;
  salon_name: string;
  open_time: string;
  close_time: string;
  online_tokens_on: boolean;
  last_token: number;
  token_date: string;
}

export interface QueueEntry {
  id: string;
  token_number: number;
  token_prefix: 'O' | 'W';
  token_date: string;
  customer_name: string;
  phone?: string; // Hidden in public views
  service_ids: string[];
  total_minutes: number;
  total_price: number;
  preferred_barber_id?: string | null;
  assigned_barber_id?: string | null;
  status: TokenStatus;
  late_extension_used: boolean;
  joined_at: string;
  called_at?: string | null;
  started_at?: string | null;
  finished_at?: string | null;
  // Joined or calculated fields
  services?: Service[];
  preferred_barber?: Barber | null;
  assigned_barber?: Barber | null;
  position?: number;
  estimated_wait_minutes?: number;
}

export interface Staff {
  email: string;
  role: StaffRole;
}
