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
          user_id: string
          role: 'patient' | 'hospital' | 'responder' | 'admin'
          full_name: string
          phone: string | null
          avatar_url: string | null
          date_of_birth: string | null
          blood_type: string | null
          allergies: string[] | null
          medical_conditions: string[] | null
          medications: string[] | null
          emergency_notes: string | null
          address: string | null
          city: string | null
          state: string | null
          zip_code: string | null
          country: string | null
          latitude: number | null
          longitude: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role: 'patient' | 'hospital' | 'responder' | 'admin'
          full_name: string
          phone?: string | null
          avatar_url?: string | null
          date_of_birth?: string | null
          blood_type?: string | null
          allergies?: string[] | null
          medical_conditions?: string[] | null
          medications?: string[] | null
          emergency_notes?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          country?: string | null
          latitude?: number | null
          longitude?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: 'patient' | 'hospital' | 'responder' | 'admin'
          full_name?: string
          phone?: string | null
          avatar_url?: string | null
          date_of_birth?: string | null
          blood_type?: string | null
          allergies?: string[] | null
          medical_conditions?: string[] | null
          medications?: string[] | null
          emergency_notes?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          country?: string | null
          latitude?: number | null
          longitude?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      emergency_contacts: {
        Row: {
          id: string
          patient_id: string
          name: string
          relationship: string
          phone: string
          email: string | null
          is_primary: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          name: string
          relationship: string
          phone: string
          email?: string | null
          is_primary?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          name?: string
          relationship?: string
          phone?: string
          email?: string | null
          is_primary?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "emergency_contacts_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      hospitals: {
        Row: {
          id: string
          profile_id: string
          name: string
          license_number: string
          address: string
          city: string
          state: string
          zip_code: string
          country: string
          phone: string
          email: string
          latitude: number
          longitude: number
          emergency_capacity: number
          current_load: number
          accepts_ambulance: boolean
          specialties: string[] | null
          is_verified: boolean
          is_active: boolean
          operating_hours: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          name: string
          license_number: string
          address: string
          city: string
          state: string
          zip_code: string
          country: string
          phone: string
          email: string
          latitude: number
          longitude: number
          emergency_capacity?: number
          current_load?: number
          accepts_ambulance?: boolean
          specialties?: string[] | null
          is_verified?: boolean
          is_active?: boolean
          operating_hours?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          name?: string
          license_number?: string
          address?: string
          city?: string
          state?: string
          zip_code?: string
          country?: string
          phone?: string
          email?: string
          latitude?: number
          longitude?: number
          emergency_capacity?: number
          current_load?: number
          accepts_ambulance?: boolean
          specialties?: string[] | null
          is_verified?: boolean
          is_active?: boolean
          operating_hours?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hospitals_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      responders: {
        Row: {
          id: string
          profile_id: string
          employee_id: string
          hospital_id: string | null
          license_number: string
          certification_level: 'EMT' | 'AEMT' | 'Paramedic' | 'RN' | 'MD'
          specialties: string[] | null
          is_available: boolean
          current_latitude: number | null
          current_longitude: number | null
          last_location_update: string | null
          shift_start: string | null
          shift_end: string | null
          vehicle_type: 'ambulance' | 'medic_unit' | 'supervisor' | 'other' | null
          vehicle_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          employee_id: string
          hospital_id?: string | null
          license_number: string
          certification_level: 'EMT' | 'AEMT' | 'Paramedic' | 'RN' | 'MD'
          specialties?: string[] | null
          is_available?: boolean
          current_latitude?: number | null
          current_longitude?: number | null
          last_location_update?: string | null
          shift_start?: string | null
          shift_end?: string | null
          vehicle_type?: 'ambulance' | 'medic_unit' | 'supervisor' | 'other' | null
          vehicle_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          employee_id?: string
          hospital_id?: string | null
          license_number?: string
          certification_level?: 'EMT' | 'AEMT' | 'Paramedic' | 'RN' | 'MD'
          specialties?: string[] | null
          is_available?: boolean
          current_latitude?: number | null
          current_longitude?: number | null
          last_location_update?: string | null
          shift_start?: string | null
          shift_end?: string | null
          vehicle_type?: 'ambulance' | 'medic_unit' | 'supervisor' | 'other' | null
          vehicle_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "responders_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "responders_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          }
        ]
      }
      emergencies: {
        Row: {
          id: string
          patient_id: string
          hospital_id: string | null
          responder_id: string | null
          status: 'pending' | 'accepted' | 'on_the_way' | 'arrived' | 'resolved' | 'cancelled'
          priority: 'low' | 'medium' | 'high' | 'critical'
          chief_complaint: string
          description: string | null
          patient_latitude: number
          patient_longitude: number
          patient_address: string | null
          hospital_latitude: number | null
          hospital_longitude: number | null
          responder_latitude: number | null
          responder_longitude: number | null
          estimated_arrival: string | null
          actual_arrival: string | null
          resolved_at: string | null
          cancelled_at: string | null
          cancellation_reason: string | null
          vitals: Json | null
          medications_given: string[] | null
          procedures_performed: string[] | null
          transport_destination: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          hospital_id?: string | null
          responder_id?: string | null
          status?: 'pending' | 'accepted' | 'on_the_way' | 'arrived' | 'resolved' | 'cancelled'
          priority?: 'low' | 'medium' | 'high' | 'critical'
          chief_complaint: string
          description?: string | null
          patient_latitude: number
          patient_longitude: number
          patient_address?: string | null
          hospital_latitude?: number | null
          hospital_longitude?: number | null
          responder_latitude?: number | null
          responder_longitude?: number | null
          estimated_arrival?: string | null
          actual_arrival?: string | null
          resolved_at?: string | null
          cancelled_at?: string | null
          cancellation_reason?: string | null
          vitals?: Json | null
          medications_given?: string[] | null
          procedures_performed?: string[] | null
          transport_destination?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          hospital_id?: string | null
          responder_id?: string | null
          status?: 'pending' | 'accepted' | 'on_the_way' | 'arrived' | 'resolved' | 'cancelled'
          priority?: 'low' | 'medium' | 'high' | 'critical'
          chief_complaint?: string
          description?: string | null
          patient_latitude?: number
          patient_longitude?: number
          patient_address?: string | null
          hospital_latitude?: number | null
          hospital_longitude?: number | null
          responder_latitude?: number | null
          responder_longitude?: number | null
          estimated_arrival?: string | null
          actual_arrival?: string | null
          resolved_at?: string | null
          cancelled_at?: string | null
          cancellation_reason?: string | null
          vitals?: Json | null
          medications_given?: string[] | null
          procedures_performed?: string[] | null
          transport_destination?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "emergencies_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergencies_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergencies_responder_id_fkey"
            columns: ["responder_id"]
            isOneToOne: false
            referencedRelation: "responders"
            referencedColumns: ["id"]
          }
        ]
      }
      emergency_responses: {
        Row: {
          id: string
          emergency_id: string
          responder_id: string
          status: 'assigned' | 'en_route' | 'on_scene' | 'transporting' | 'at_hospital' | 'completed'
          latitude: number | null
          longitude: number | null
          notes: string | null
          vitals: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          emergency_id: string
          responder_id: string
          status?: 'assigned' | 'en_route' | 'on_scene' | 'transporting' | 'at_hospital' | 'completed'
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          vitals?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          emergency_id?: string
          responder_id?: string
          status?: 'assigned' | 'en_route' | 'on_scene' | 'transporting' | 'at_hospital' | 'completed'
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          vitals?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "emergency_responses_emergency_id_fkey"
            columns: ["emergency_id"]
            isOneToOne: false
            referencedRelation: "emergencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_responses_responder_id_fkey"
            columns: ["responder_id"]
            isOneToOne: false
            referencedRelation: "responders"
            referencedColumns: ["id"]
          }
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: 'emergency_created' | 'emergency_accepted' | 'responder_assigned' | 'responder_en_route' | 'responder_arrived' | 'emergency_resolved' | 'emergency_cancelled' | 'system_alert'
          title: string
          message: string
          emergency_id: string | null
          is_read: boolean
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'emergency_created' | 'emergency_accepted' | 'responder_assigned' | 'responder_en_route' | 'responder_arrived' | 'emergency_resolved' | 'emergency_cancelled' | 'system_alert'
          title: string
          message: string
          emergency_id?: string | null
          is_read?: boolean
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'emergency_created' | 'emergency_accepted' | 'responder_assigned' | 'responder_en_route' | 'responder_arrived' | 'emergency_resolved' | 'emergency_cancelled' | 'system_alert'
          title?: string
          message?: string
          emergency_id?: string | null
          is_read?: boolean
          metadata?: Json | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          entity_type: string
          entity_id: string
          old_data: Json | null
          new_data: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          entity_type: string
          entity_id: string
          old_data?: Json | null
          new_data?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          entity_type?: string
          entity_id?: string
          old_data?: Json | null
          new_data?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_nearby_hospitals: {
        Args: {
          user_lat: number
          user_lng: number
          radius_km?: number
          limit?: number
        }
        Returns: {
          id: string
          name: string
          address: string
          city: string
          state: string
          phone: string
          latitude: number
          longitude: number
          emergency_capacity: number
          current_load: number
          accepts_ambulance: boolean
          specialties: string[] | null
          distance_km: number
        }[]
      }
      get_available_responders: {
        Args: {
          hospital_id: string
          lat?: number
          lng?: number
          radius_km?: number
        }
        Returns: {
          id: string
          profile_id: string
          employee_id: string
          full_name: string
          certification_level: string
          specialties: string[] | null
          current_latitude: number | null
          current_longitude: number | null
          vehicle_type: string | null
          distance_km: number | null
        }[]
      }
      assign_responder_to_emergency: {
        Args: {
          emergency_id: string
          responder_id: string
          hospital_id: string
        }
        Returns: boolean
      }
      update_emergency_status: {
        Args: {
          emergency_id: string
          new_status: 'pending' | 'accepted' | 'on_the_way' | 'arrived' | 'resolved' | 'cancelled'
          user_id: string
          user_role: 'patient' | 'hospital' | 'responder' | 'admin'
        }
        Returns: boolean
      }
      log_audit_event: {
        Args: {
          p_user_id: string | null
          p_action: string
          p_entity_type: string
          p_entity_id: string
          p_old_data: Json | null
          p_new_data: Json | null
        }
        Returns: void
      }
    }
    Enums: {
      user_role: 'patient' | 'hospital' | 'responder' | 'admin'
      emergency_status: 'pending' | 'accepted' | 'on_the_way' | 'arrived' | 'resolved' | 'cancelled'
      emergency_priority: 'low' | 'medium' | 'high' | 'critical'
      responder_certification: 'EMT' | 'AEMT' | 'Paramedic' | 'RN' | 'MD'
      responder_status: 'assigned' | 'en_route' | 'on_scene' | 'transporting' | 'at_hospital' | 'completed'
      notification_type: 'emergency_created' | 'emergency_accepted' | 'responder_assigned' | 'responder_en_route' | 'responder_arrived' | 'emergency_resolved' | 'emergency_cancelled' | 'system_alert'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}