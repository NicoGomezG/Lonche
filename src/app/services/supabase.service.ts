import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

export interface InstagramPost {
  media_id: string;
  caption: string | null;
  media_type: string;
  media_url: string | null;
  thumbnail_url: string | null;
  permalink: string | null;
  timestamp: string | null;
}

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private client: SupabaseClient = createClient(environment.supabaseUrl, environment.supabaseAnonKey);

  async getInstagramPosts(limit = 6): Promise<InstagramPost[]> {
    const { data, error } = await this.client
      .from('instagram_posts')
      .select('media_id,caption,media_type,media_url,thumbnail_url,permalink,timestamp')
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error cargando posts de Instagram:', error.message);
      return [];
    }
    return data ?? [];
  }
}
