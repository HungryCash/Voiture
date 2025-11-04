export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          user_type: 'passenger' | 'driver'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          user_type: 'passenger' | 'driver'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          user_type?: 'passenger' | 'driver'
          created_at?: string
          updated_at?: string
        }
      }
      bus_stops: {
        Row: {
          id: string
          name: string
          address: string
          latitude: number | null
          longitude: number | null
          route_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          address: string
          latitude?: number | null
          longitude?: number | null
          route_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string
          latitude?: number | null
          longitude?: number | null
          route_id?: string | null
          created_at?: string
        }
      }
      passenger_counts: {
        Row: {
          id: string
          bus_stop_id: string
          count: number
          status: 'normal' | 'crowded' | 'urgent'
          timestamp: string
        }
        Insert: {
          id?: string
          bus_stop_id: string
          count?: number
          status: 'normal' | 'crowded' | 'urgent'
          timestamp?: string
        }
        Update: {
          id?: string
          bus_stop_id?: string
          count?: number
          status?: 'normal' | 'crowded' | 'urgent'
          timestamp?: string
        }
      }
      routes: {
        Row: {
          id: string
          name: string
          route_type: 'bus' | 'shuttle' | 'scooter' | 'flight' | 'train'
          origin: string
          destination: string
          duration_minutes: number | null
          price_min: number | null
          price_max: number | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          route_type: 'bus' | 'shuttle' | 'scooter' | 'flight' | 'train'
          origin: string
          destination: string
          duration_minutes?: number | null
          price_min?: number | null
          price_max?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          route_type?: 'bus' | 'shuttle' | 'scooter' | 'flight' | 'train'
          origin?: string
          destination?: string
          duration_minutes?: number | null
          price_min?: number | null
          price_max?: number | null
          created_at?: string
        }
      }
      saved_routes: {
        Row: {
          id: string
          user_id: string
          route_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          route_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          route_id?: string
          created_at?: string
        }
      }
      driver_assignments: {
        Row: {
          id: string
          driver_id: string
          route_name: string
          bus_number: string | null
          status: 'active' | 'inactive' | 'completed'
          started_at: string
          ended_at: string | null
        }
        Insert: {
          id?: string
          driver_id: string
          route_name: string
          bus_number?: string | null
          status: 'active' | 'inactive' | 'completed'
          started_at?: string
          ended_at?: string | null
        }
        Update: {
          id?: string
          driver_id?: string
          route_name?: string
          bus_number?: string | null
          status?: 'active' | 'inactive' | 'completed'
          started_at?: string
          ended_at?: string | null
        }
      }
      backup_requests: {
        Row: {
          id: string
          driver_id: string
          route_name: string
          bus_stop_id: string | null
          reason: string | null
          status: 'pending' | 'approved' | 'rejected' | 'completed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          driver_id: string
          route_name: string
          bus_stop_id?: string | null
          reason?: string | null
          status: 'pending' | 'approved' | 'rejected' | 'completed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          driver_id?: string
          route_name?: string
          bus_stop_id?: string | null
          reason?: string | null
          status?: 'pending' | 'approved' | 'rejected' | 'completed'
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
