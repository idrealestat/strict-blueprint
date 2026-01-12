import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/context/AuthContext';
import { toast } from 'sonner';

export interface CustomTag {
  id: string;
  name: string;
  color: string;
}

export const useCRMCustomTags = () => {
  const { user } = useAuthContext();
  const [customTags, setCustomTags] = useState<CustomTag[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Default tags if none exist
  const defaultTags: Omit<CustomTag, 'id'>[] = [
    { name: 'VIP', color: '#ef4444' },
    { name: 'مستعجل', color: '#f97316' },
    { name: 'متابعة', color: '#10b981' },
    { name: 'تمويل', color: '#3b82f6' },
    { name: 'استثمار', color: '#8b5cf6' },
  ];

  // Fetch tags from database
  const fetchTags = async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('crm_custom_tags')
        .select('id, name, color')
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        setCustomTags(data);
      } else {
        // Initialize with default tags
        await initializeDefaultTags();
      }
    } catch (error) {
      console.error('Error fetching custom tags:', error);
      // Use defaults in memory if fetch fails
      setCustomTags(defaultTags.map((t, i) => ({ ...t, id: `temp-${i}` })));
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize default tags for new users
  const initializeDefaultTags = async () => {
    if (!user?.id) return;

    try {
      const tagsToInsert = defaultTags.map(tag => ({
        user_id: user.id,
        name: tag.name,
        color: tag.color,
      }));

      const { data, error } = await supabase
        .from('crm_custom_tags')
        .insert(tagsToInsert)
        .select('id, name, color');

      if (error) throw error;

      if (data) {
        setCustomTags(data);
      }
    } catch (error) {
      console.error('Error initializing default tags:', error);
      setCustomTags(defaultTags.map((t, i) => ({ ...t, id: `temp-${i}` })));
    }
  };

  // Add a new tag
  const addTag = async (name: string, color: string): Promise<CustomTag | null> => {
    if (!user?.id) return null;

    // Check if tag already exists
    if (customTags.some(t => t.name === name)) {
      toast.error('هذا التاق موجود بالفعل');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('crm_custom_tags')
        .insert({
          user_id: user.id,
          name,
          color,
        })
        .select('id, name, color')
        .single();

      if (error) throw error;

      if (data) {
        setCustomTags(prev => [...prev, data]);
        toast.success('تم إضافة التاق بنجاح');
        return data;
      }
      return null;
    } catch (error) {
      console.error('Error adding tag:', error);
      toast.error('فشل في إضافة التاق');
      return null;
    }
  };

  // Update a tag
  const updateTag = async (id: string, name: string, color: string): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const { error } = await supabase
        .from('crm_custom_tags')
        .update({ name, color })
        .eq('id', id);

      if (error) throw error;

      setCustomTags(prev => prev.map(t => t.id === id ? { ...t, name, color } : t));
      toast.success('تم تحديث التاق بنجاح');
      return true;
    } catch (error) {
      console.error('Error updating tag:', error);
      toast.error('فشل في تحديث التاق');
      return false;
    }
  };

  // Delete a tag
  const deleteTag = async (id: string): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const { error } = await supabase
        .from('crm_custom_tags')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCustomTags(prev => prev.filter(t => t.id !== id));
      toast.success('تم حذف التاق بنجاح');
      return true;
    } catch (error) {
      console.error('Error deleting tag:', error);
      toast.error('فشل في حذف التاق');
      return false;
    }
  };

  // Load tags on mount
  useEffect(() => {
    fetchTags();
  }, [user?.id]);

  return {
    customTags,
    isLoading,
    addTag,
    updateTag,
    deleteTag,
    refetch: fetchTags,
  };
};
