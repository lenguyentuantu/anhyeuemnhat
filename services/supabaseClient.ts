
import { createClient } from '@supabase/supabase-js';

// --- CẤU HÌNH SUPABASE ---
// Đã cập nhật theo thông tin bạn cung cấp
const SUPABASE_URL: string = 'https://wkglyallrjdugyorlgex.supabase.co';
const SUPABASE_ANON_KEY: string = 'sb_publishable_6BxyBnOZIlaBJZpd6BJfFw_Fdjvzmdy';

// Kiểm tra xem đã cấu hình chưa (URL không phải là placeholder)
export const isSupabaseConfigured = SUPABASE_URL !== 'https://your-project-url.supabase.co' && !SUPABASE_URL.includes('your-project-url');

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
