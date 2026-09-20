export type UserRole = 'patient' | 'hospital' | 'responder' | 'admin';

export interface Profile {
  id: string;
  user_id: string;
  role: UserRole;
  full_name: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
  date_of_birth?: string;
  blood_type?: string;
  allergies?: string[];
  medical_conditions?: string[];
  medications?: string[];
  emergency_notes?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  created_at: string;
  updated_at: string;
}

export interface EmergencyContact {
  id: string;
  patient_id: string;
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface Hospital {
  id: string;
  profile_id?: string;
  name: string;
  license_number?: string;
  address: string;
  city: string;
  state: string;
  zip_code?: string;
  country?: string;
  phone: string;
  email?: string;
  latitude: number;
  longitude: number;
  emergency_capacity: number;
  current_load: number;
  accepts_ambulance: boolean;
  specialties: string[];
  is_verified?: boolean;
  is_active?: boolean;
  operating_hours?: any;
  created_at?: string;
  updated_at?: string;
}

export interface Responder {
  id: string;
  profile_id: string;
  employee_id: string;
  hospital_id?: string;
  license_number?: string;
  certification_level: any;
  specialties: string[];
  is_available?: boolean;
  current_latitude?: number;
  current_longitude?: number;
  last_location_update?: string;
  shift_start?: string;
  shift_end?: string;
  vehicle_type?: any;
  vehicle_id?: string;
  full_name?: string;
  distance_km?: number;
  profiles?: any;
  created_at?: string;
  updated_at?: string;
}

export type EmergencyStatus = 'pending' | 'accepted' | 'on_the_way' | 'arrived' | 'resolved' | 'cancelled';

export interface Emergency {
  id: string;
  patient_id: string;
  hospital_id?: string;
  responder_id?: string;
  status: EmergencyStatus;
  priority: 'low' | 'medium' | 'high' | 'critical';
  chief_complaint: string;
  description?: string;
  patient_latitude: number;
  patient_longitude: number;
  patient_address?: string;
  hospital_latitude?: number;
  hospital_longitude?: number;
  responder_latitude?: number;
  responder_longitude?: number;
  estimated_arrival?: string;
  actual_arrival?: string;
  resolved_at?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  vitals?: any;
  medications_given?: string[];
  procedures_performed?: string[];
  transport_destination?: string;
  created_at: string;
  updated_at: string;
  patient?: any;
  hospital?: any;
  responder?: any;
}

export interface EmergencyResponse {
  id: string;
  emergency_id: string;
  responder_id: string;
  status: 'assigned' | 'en_route' | 'on_scene' | 'transporting' | 'at_hospital' | 'completed';
  latitude?: number;
  longitude?: number;
  notes?: string;
  vitals?: any;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'emergency_created' | 'emergency_accepted' | 'responder_assigned' | 'responder_en_route' | 'responder_arrived' | 'emergency_resolved' | 'emergency_cancelled' | 'system_alert';
  title: string;
  message: string;
  emergency_id?: string;
  is_read: boolean;
  metadata?: any;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_data?: any;
  new_data?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  profile?: Profile;
  hospital?: Hospital;
  responder?: Responder;
}

export interface LocationCoords {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  type: 'patient' | 'hospital' | 'responder';
  label: string;
  status?: EmergencyStatus;
}

export interface EmergencyTimelineEvent {
  id: string;
  emergency_id: string;
  status: EmergencyStatus;
  timestamp: string;
  actor_id?: string;
  actor_role?: UserRole;
  notes?: string;
  location?: LocationCoords;
}

export interface DashboardStats {
  totalEmergencies: number;
  activeEmergencies: number;
  resolvedToday: number;
  averageResponseTime: number;
  availableResponders: number;
  hospitalCapacity: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
