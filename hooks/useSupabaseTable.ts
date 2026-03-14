
import { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';

export const useSupabaseTable = <T>(tableName: string) => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  // Hàm lấy dữ liệu (được gọi lúc đầu và mỗi khi có thay đổi)
  const fetchData = async () => {
    try {
      // Lấy toàn bộ dữ liệu với giới hạn tăng lên 5000 dòng (Mặc định Supabase chỉ 1000)
      const { data: result, error: fetchError } = await supabase
        .from(tableName)
        .select('*')
        .range(0, 5000); 

      if (fetchError) throw fetchError;
      setData(result as T[]);
    } catch (err) {
      console.error(`Lỗi khi tải bảng ${tableName}:`, err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 1. Lấy dữ liệu lần đầu tiên khi vào trang
    fetchData();

    // 2. Đăng ký kênh "nghe lén" (Realtime Subscription)
    const channel = supabase
      .channel(`realtime_${tableName}`) 
      .on(
        'postgres_changes',
        { 
          event: '*',            
          schema: 'public', 
          table: tableName       
        },
        (payload) => {
          console.log(`Có biến động ở bảng ${tableName}!`, payload);
          fetchData();
        }
      )
      .subscribe();

    // 3. Dọn dẹp
    return () => {
      supabase.removeChannel(channel);
    };
  }, [tableName]); 

  // Trả về thêm hàm refresh để component có thể chủ động gọi lại
  return { data, loading, error, refresh: fetchData };
};

export default useSupabaseTable;
