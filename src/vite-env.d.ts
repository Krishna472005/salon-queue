/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_DEMO_PIN_ENABLED?: string;
  readonly VITE_DEMO_RECEPTION_EMAIL?: string;
  readonly VITE_DEMO_RECEPTION_PASSWORD?: string;
  readonly VITE_DEMO_OWNER_EMAIL?: string;
  readonly VITE_DEMO_OWNER_PASSWORD?: string;
  readonly VITE_DEMO_BARBER_EMAIL?: string;
  readonly VITE_DEMO_BARBER_PASSWORD?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
