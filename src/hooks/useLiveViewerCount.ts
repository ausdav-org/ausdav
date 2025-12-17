import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useLiveViewerCount = () => {
  const [viewerCount, setViewerCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  useEffect(() => {
    // Check for authenticated user
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const userId = user?.id || crypto.randomUUID();
    
    const channel = supabase.channel('online-users', {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const count = Object.keys(state).length;
        setViewerCount(count);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        console.log('User joined:', newPresences);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        console.log('User left:', leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          await channel.track({
            user_id: userId,
            online_at: new Date().toISOString(),
            page: window.location.pathname,
            is_authenticated: !!user,
          });
        }
      });

    return () => {
      channel.unsubscribe();
      setIsConnected(false);
    };
  }, [user]);

  return { viewerCount, isConnected, isAuthenticated: !!user };
};
