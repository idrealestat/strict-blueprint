/**
 * useCalendarAppointments.ts
 * Hook لإدارة المواعيد في قاعدة البيانات (calendar_appointments)
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CalendarAppointment {
  id: string;
  title: string;
  customerName: string;
  customerPhone: string;
  appointmentDate: Date;
  appointmentTime: string;
  duration: number;
  appointmentType: string;
  status: string;
  location?: string;
  propertyId?: string;
  propertyTitle?: string;
  notes?: string;
  reminder: boolean;
  reminderTime: number;
  createdAt?: string;
  updatedAt?: string;
}

// تحويل من DB إلى Interface
const mapDbToAppointment = (row: any): CalendarAppointment => ({
  id: row.id,
  title: row.title,
  customerName: row.customer_name,
  customerPhone: row.customer_phone || '',
  appointmentDate: new Date(row.appointment_date),
  appointmentTime: row.appointment_time,
  duration: row.duration || 60,
  appointmentType: row.appointment_type || 'viewing',
  status: row.status || 'scheduled',
  location: row.location,
  propertyId: row.property_id,
  propertyTitle: row.property_title,
  notes: row.notes,
  reminder: row.reminder ?? true,
  reminderTime: row.reminder_time || 30,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

// تحويل من Interface إلى DB
const mapAppointmentToDb = (apt: Partial<CalendarAppointment>) => ({
  title: apt.title,
  customer_name: apt.customerName,
  customer_phone: apt.customerPhone,
  appointment_date: apt.appointmentDate?.toISOString(),
  appointment_time: apt.appointmentTime,
  duration: apt.duration,
  appointment_type: apt.appointmentType,
  status: apt.status,
  location: apt.location,
  property_id: apt.propertyId,
  property_title: apt.propertyTitle,
  notes: apt.notes,
  reminder: apt.reminder,
  reminder_time: apt.reminderTime,
});

export function useCalendarAppointments() {
  const [appointments, setAppointments] = useState<CalendarAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // جلب المواعيد
  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('calendar_appointments')
        .select('*')
        .order('appointment_date', { ascending: true });

      if (fetchError) throw fetchError;

      setAppointments((data || []).map(mapDbToAppointment));
    } catch (err: any) {
      console.error('Error fetching appointments:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // إضافة موعد جديد
  const addAppointment = async (apt: Omit<CalendarAppointment, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const dbData = mapAppointmentToDb(apt);
      
      const { data, error: insertError } = await supabase
        .from('calendar_appointments')
        .insert(dbData)
        .select()
        .single();

      if (insertError) throw insertError;

      const newApt = mapDbToAppointment(data);
      setAppointments(prev => [...prev, newApt]);
      toast.success('تم إضافة الموعد بنجاح');
      return newApt;
    } catch (err: any) {
      console.error('Error adding appointment:', err);
      toast.error('فشل في إضافة الموعد');
      throw err;
    }
  };

  // تحديث موعد
  const updateAppointment = async (id: string, updates: Partial<CalendarAppointment>) => {
    try {
      const dbData = mapAppointmentToDb(updates);
      
      const { data, error: updateError } = await supabase
        .from('calendar_appointments')
        .update(dbData)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      const updatedApt = mapDbToAppointment(data);
      setAppointments(prev => prev.map(a => a.id === id ? updatedApt : a));
      toast.success('تم تحديث الموعد بنجاح');
      return updatedApt;
    } catch (err: any) {
      console.error('Error updating appointment:', err);
      toast.error('فشل في تحديث الموعد');
      throw err;
    }
  };

  // حذف موعد
  const deleteAppointment = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('calendar_appointments')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setAppointments(prev => prev.filter(a => a.id !== id));
      toast.success('تم حذف الموعد بنجاح');
    } catch (err: any) {
      console.error('Error deleting appointment:', err);
      toast.error('فشل في حذف الموعد');
      throw err;
    }
  };

  // الاستماع للتحديثات الفورية
  useEffect(() => {
    fetchAppointments();

    const channel = supabase
      .channel('calendar-appointments-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'calendar_appointments',
        },
        (payload) => {
          console.log('Appointment realtime update:', payload);
          if (payload.eventType === 'INSERT') {
            setAppointments(prev => [...prev, mapDbToAppointment(payload.new)]);
          } else if (payload.eventType === 'UPDATE') {
            setAppointments(prev => prev.map(a => 
              a.id === payload.new.id ? mapDbToAppointment(payload.new) : a
            ));
          } else if (payload.eventType === 'DELETE') {
            setAppointments(prev => prev.filter(a => a.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAppointments]);

  return {
    appointments,
    loading,
    error,
    fetchAppointments,
    addAppointment,
    updateAppointment,
    deleteAppointment,
  };
}

// دالة مساعدة لحفظ موعد معاينة من صفحة العروض (مع sync للـ DB)
export async function saveViewingAppointmentToDb(data: {
  title: string;
  customerName: string;
  customerPhone: string;
  date: string;
  time: string;
  propertyId: string;
  propertyTitle: string;
  location: string;
  notes?: string;
}): Promise<boolean> {
  try {
    const appointmentData = {
      title: data.title,
      customer_name: data.customerName,
      customer_phone: data.customerPhone,
      appointment_date: new Date(data.date).toISOString(),
      appointment_time: data.time,
      duration: 60,
      appointment_type: 'viewing',
      status: 'scheduled',
      location: data.location,
      property_id: data.propertyId,
      property_title: data.propertyTitle,
      notes: data.notes || null,
      reminder: true,
      reminder_time: 30,
    };

    const { error } = await supabase
      .from('calendar_appointments')
      .insert(appointmentData);

    if (error) {
      console.error('Error saving appointment to DB:', error);
      return false;
    }

    console.log('Appointment saved to DB successfully');
    return true;
  } catch (err) {
    console.error('Error in saveViewingAppointmentToDb:', err);
    return false;
  }
}
