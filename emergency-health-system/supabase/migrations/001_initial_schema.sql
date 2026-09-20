-- Emergency Health Alert & Response System Database Schema
-- Run this in Supabase SQL Editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Custom types
CREATE TYPE user_role AS ENUM ('patient', 'hospital', 'responder', 'admin');
CREATE TYPE emergency_status AS ENUM ('pending', 'accepted', 'on_the_way', 'arrived', 'resolved', 'cancelled');
CREATE TYPE emergency_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE responder_certification AS ENUM ('EMT', 'AEMT', 'Paramedic', 'RN', 'MD');
CREATE TYPE responder_status AS ENUM ('assigned', 'en_route', 'on_scene', 'transporting', 'at_hospital', 'completed');
CREATE TYPE notification_type AS ENUM (
  'emergency_created', 'emergency_accepted', 'responder_assigned',
  'responder_en_route', 'responder_arrived', 'emergency_resolved',
  'emergency_cancelled', 'system_alert'
);
CREATE TYPE vehicle_type AS ENUM ('ambulance', 'medic_unit', 'supervisor', 'other');

-- Profiles table (linked to Supabase Auth users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'patient',
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  date_of_birth DATE,
  blood_type TEXT,
  allergies TEXT[],
  medical_conditions TEXT[],
  medications TEXT[],
  emergency_notes TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  country TEXT DEFAULT 'US',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Emergency contacts for patients
CREATE TABLE emergency_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  relationship TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Hospitals table
CREATE TABLE hospitals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  license_number TEXT NOT NULL UNIQUE,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'US',
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  emergency_capacity INTEGER NOT NULL DEFAULT 10,
  current_load INTEGER NOT NULL DEFAULT 0,
  accepts_ambulance BOOLEAN NOT NULL DEFAULT TRUE,
  specialties TEXT[],
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  operating_hours JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Responders table
CREATE TABLE responders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  employee_id TEXT NOT NULL UNIQUE,
  hospital_id UUID REFERENCES hospitals(id) ON DELETE SET NULL,
  license_number TEXT NOT NULL UNIQUE,
  certification_level responder_certification NOT NULL,
  specialties TEXT[],
  is_available BOOLEAN NOT NULL DEFAULT FALSE,
  current_latitude DOUBLE PRECISION,
  current_longitude DOUBLE PRECISION,
  last_location_update TIMESTAMPTZ,
  shift_start TIME,
  shift_end TIME,
  vehicle_type vehicle_type,
  vehicle_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Emergencies table
CREATE TABLE emergencies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  hospital_id UUID REFERENCES hospitals(id) ON DELETE SET NULL,
  responder_id UUID REFERENCES responders(id) ON DELETE SET NULL,
  status emergency_status NOT NULL DEFAULT 'pending',
  priority emergency_priority NOT NULL DEFAULT 'high',
  chief_complaint TEXT NOT NULL,
  description TEXT,
  patient_latitude DOUBLE PRECISION NOT NULL,
  patient_longitude DOUBLE PRECISION NOT NULL,
  patient_address TEXT,
  hospital_latitude DOUBLE PRECISION,
  hospital_longitude DOUBLE PRECISION,
  responder_latitude DOUBLE PRECISION,
  responder_longitude DOUBLE PRECISION,
  estimated_arrival TIMESTAMPTZ,
  actual_arrival TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  vitals JSONB,
  medications_given TEXT[],
  procedures_performed TEXT[],
  transport_destination TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Emergency responses (responder activity log)
CREATE TABLE emergency_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  emergency_id UUID NOT NULL REFERENCES emergencies(id) ON DELETE CASCADE,
  responder_id UUID NOT NULL REFERENCES responders(id) ON DELETE CASCADE,
  status responder_status NOT NULL DEFAULT 'assigned',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  notes TEXT,
  vitals JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  emergency_id UUID REFERENCES emergencies(id) ON DELETE SET NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_emergency_contacts_patient_id ON emergency_contacts(patient_id);
CREATE INDEX idx_hospitals_profile_id ON hospitals(profile_id);
CREATE INDEX idx_hospitals_location ON hospitals USING GIST (
  ll_to_earth(latitude, longitude)
);
CREATE INDEX idx_responders_profile_id ON responders(profile_id);
CREATE INDEX idx_responders_hospital_id ON responders(hospital_id);
CREATE INDEX idx_responders_available ON responders(is_available) WHERE is_available = TRUE;
CREATE INDEX idx_responders_location ON responders USING GIST (
  ll_to_earth(current_latitude, current_longitude)
) WHERE current_latitude IS NOT NULL AND current_longitude IS NOT NULL;
CREATE INDEX idx_emergencies_patient_id ON emergencies(patient_id);
CREATE INDEX idx_emergencies_hospital_id ON emergencies(hospital_id);
CREATE INDEX idx_emergencies_responder_id ON emergencies(responder_id);
CREATE INDEX idx_emergencies_status ON emergencies(status);
CREATE INDEX idx_emergencies_created_at ON emergencies(created_at DESC);
CREATE INDEX idx_emergencies_location ON emergencies USING GIST (
  ll_to_earth(patient_latitude, patient_longitude)
);
CREATE INDEX idx_emergency_responses_emergency_id ON emergency_responses(emergency_id);
CREATE INDEX idx_emergency_responses_responder_id ON emergency_responses(responder_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE responders ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage all profiles" ON profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'
    )
  );

-- RLS Policies for emergency_contacts
CREATE POLICY "Patients can manage own emergency contacts" ON emergency_contacts
  FOR ALL USING (
    patient_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can view all emergency contacts" ON emergency_contacts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'
    )
  );

-- RLS Policies for hospitals
CREATE POLICY "Hospital admins can view own hospital" ON hospitals
  FOR SELECT USING (
    profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Hospital admins can update own hospital" ON hospitals
  FOR UPDATE USING (
    profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can manage all hospitals" ON hospitals
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "Public can view verified active hospitals" ON hospitals
  FOR SELECT USING (is_verified = TRUE AND is_active = TRUE);

-- RLS Policies for responders
CREATE POLICY "Responders can view own profile" ON responders
  FOR SELECT USING (
    profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Responders can update own profile" ON responders
  FOR UPDATE USING (
    profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Hospital admins can view assigned responders" ON responders
  FOR SELECT USING (
    hospital_id IN (
      SELECT id FROM hospitals WHERE profile_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Hospital admins can manage assigned responders" ON responders
  FOR ALL USING (
    hospital_id IN (
      SELECT id FROM hospitals WHERE profile_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Admins can manage all responders" ON responders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'
    )
  );

-- RLS Policies for emergencies
CREATE POLICY "Patients can view own emergencies" ON emergencies
  FOR SELECT USING (
    patient_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Patients can create emergencies" ON emergencies
  FOR INSERT WITH CHECK (
    patient_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Patients can update own pending emergencies" ON emergencies
  FOR UPDATE USING (
    patient_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    AND status = 'pending'
  );

CREATE POLICY "Hospitals can view authorized emergencies" ON emergencies
  FOR SELECT USING (
    hospital_id IN (
      SELECT id FROM hospitals WHERE profile_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
      )
    )
    OR status = 'pending'
  );

CREATE POLICY "Hospitals can update assigned emergencies" ON emergencies
  FOR UPDATE USING (
    hospital_id IN (
      SELECT id FROM hospitals WHERE profile_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Responders can view assigned emergencies" ON emergencies
  FOR SELECT USING (
    responder_id IN (SELECT id FROM responders WHERE profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    ))
  );

CREATE POLICY "Responders can update assigned emergencies" ON emergencies
  FOR UPDATE USING (
    responder_id IN (SELECT id FROM responders WHERE profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    ))
  );

CREATE POLICY "Admins can manage all emergencies" ON emergencies
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'
    )
  );

-- RLS Policies for emergency_responses
CREATE POLICY "Responders can manage own responses" ON emergency_responses
  FOR ALL USING (
    responder_id IN (SELECT id FROM responders WHERE profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    ))
  );

CREATE POLICY "Hospitals can view responses for their emergencies" ON emergency_responses
  FOR SELECT USING (
    emergency_id IN (
      SELECT id FROM emergencies WHERE hospital_id IN (
        SELECT id FROM hospitals WHERE profile_id IN (
          SELECT id FROM profiles WHERE user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Admins can view all responses" ON emergency_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'
    )
  );

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (
    user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (
    user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "System can insert notifications" ON notifications
  FOR INSERT WITH CHECK (TRUE);

-- RLS Policies for audit_logs
CREATE POLICY "Admins can view audit logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "System can insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (TRUE);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emergency_contacts_updated_at BEFORE UPDATE ON emergency_contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hospitals_updated_at BEFORE UPDATE ON hospitals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_responders_updated_at BEFORE UPDATE ON responders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emergencies_updated_at BEFORE UPDATE ON emergencies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emergency_responses_updated_at BEFORE UPDATE ON emergency_responses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get nearby hospitals
CREATE OR REPLACE FUNCTION get_nearby_hospitals(
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION,
  radius_km DOUBLE PRECISION DEFAULT 50,
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  phone TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  emergency_capacity INTEGER,
  current_load INTEGER,
  accepts_ambulance BOOLEAN,
  specialties TEXT[],
  distance_km DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    h.id,
    h.name,
    h.address,
    h.city,
    h.state,
    h.phone,
    h.latitude,
    h.longitude,
    h.emergency_capacity,
    h.current_load,
    h.accepts_ambulance,
    h.specialties,
    (earth_distance(
      ll_to_earth(user_lat, user_lng),
      ll_to_earth(h.latitude, h.longitude)
    ) / 1000) AS distance_km
  FROM hospitals h
  WHERE h.is_verified = TRUE
    AND h.is_active = TRUE
    AND h.current_load < h.emergency_capacity
    AND earth_box(ll_to_earth(user_lat, user_lng), radius_km * 1000) @> ll_to_earth(h.latitude, h.longitude)
  ORDER BY distance_km
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get available responders
CREATE OR REPLACE FUNCTION get_available_responders(
  p_hospital_id UUID,
  p_lat DOUBLE PRECISION DEFAULT NULL,
  p_lng DOUBLE PRECISION DEFAULT NULL,
  radius_km DOUBLE PRECISION DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  profile_id UUID,
  employee_id TEXT,
  full_name TEXT,
  certification_level responder_certification,
  specialties TEXT[],
  current_latitude DOUBLE PRECISION,
  current_longitude DOUBLE PRECISION,
  vehicle_type vehicle_type,
  distance_km DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.profile_id,
    r.employee_id,
    p.full_name,
    r.certification_level,
    r.specialties,
    r.current_latitude,
    r.current_longitude,
    r.vehicle_type,
    CASE
      WHEN p_lat IS NOT NULL AND p_lng IS NOT NULL
           AND r.current_latitude IS NOT NULL
           AND r.current_longitude IS NOT NULL
      THEN (earth_distance(
        ll_to_earth(p_lat, p_lng),
        ll_to_earth(r.current_latitude, r.current_longitude)
      ) / 1000)
      ELSE NULL
    END AS distance_km
  FROM responders r
  JOIN profiles p ON p.id = r.profile_id
  WHERE r.hospital_id = p_hospital_id
    AND r.is_available = TRUE
    AND (
      p_lat IS NULL OR p_lng IS NULL
      OR r.current_latitude IS NULL
      OR r.current_longitude IS NULL
      OR earth_box(ll_to_earth(p_lat, p_lng), radius_km * 1000) @> ll_to_earth(r.current_latitude, r.current_longitude)
    )
  ORDER BY distance_km NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to assign responder to emergency
CREATE OR REPLACE FUNCTION assign_responder_to_emergency(
  p_emergency_id UUID,
  p_responder_id UUID,
  p_hospital_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_emergency emergencies%ROWTYPE;
  v_responder responders%ROWTYPE;
  v_hospital hospitals%ROWTYPE;
BEGIN
  -- Verify emergency exists and is assigned to this hospital
  SELECT * INTO v_emergency FROM emergencies WHERE id = p_emergency_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Emergency not found';
  END IF;

  IF v_emergency.hospital_id != p_hospital_id THEN
    RAISE EXCEPTION 'Emergency not assigned to this hospital';
  END IF;

  IF v_emergency.status != 'accepted' THEN
    RAISE EXCEPTION 'Emergency must be accepted first';
  END IF;

  -- Verify responder exists and belongs to this hospital
  SELECT * INTO v_responder FROM responders WHERE id = p_responder_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Responder not found';
  END IF;

  IF v_responder.hospital_id != p_hospital_id THEN
    RAISE EXCEPTION 'Responder not assigned to this hospital';
  END IF;

  IF NOT v_responder.is_available THEN
    RAISE EXCEPTION 'Responder not available';
  END IF;

  -- Update emergency
  UPDATE emergencies
  SET responder_id = p_responder_id,
      status = 'on_the_way',
      responder_latitude = v_responder.current_latitude,
      responder_longitude = v_responder.current_longitude,
      updated_at = NOW()
  WHERE id = p_emergency_id;

  -- Create emergency response record
  INSERT INTO emergency_responses (emergency_id, responder_id, status)
  VALUES (p_emergency_id, p_responder_id, 'assigned');

  -- Update responder availability
  UPDATE responders SET is_available = FALSE WHERE id = p_responder_id;

  -- Update hospital load
  UPDATE hospitals SET current_load = current_load + 1 WHERE id = p_hospital_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update emergency status
CREATE OR REPLACE FUNCTION update_emergency_status(
  p_emergency_id UUID,
  p_new_status emergency_status,
  p_user_id UUID,
  p_user_role user_role
)
RETURNS BOOLEAN AS $$
DECLARE
  v_emergency emergencies%ROWTYPE;
  v_old_status emergency_status;
  v_profile profiles%ROWTYPE;
BEGIN
  SELECT * INTO v_emergency FROM emergencies WHERE id = p_emergency_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Emergency not found';
  END IF;

  v_old_status := v_emergency.status;

  -- Validate status transitions based on role
  CASE p_user_role
    WHEN 'patient' THEN
      IF p_new_status != 'cancelled' OR v_old_status NOT IN ('pending', 'accepted') THEN
        RAISE EXCEPTION 'Patients can only cancel pending or accepted emergencies';
      END IF;
    WHEN 'hospital' THEN
      IF p_new_status NOT IN ('accepted', 'cancelled') THEN
        RAISE EXCEPTION 'Hospitals can only accept or cancel emergencies';
      END IF;
      IF p_new_status = 'accepted' AND v_old_status != 'pending' THEN
        RAISE EXCEPTION 'Can only accept pending emergencies';
      END IF;
    WHEN 'responder' THEN
      IF p_new_status NOT IN ('on_the_way', 'arrived', 'resolved') THEN
        RAISE EXCEPTION 'Invalid status transition for responder';
      END IF;
      IF p_new_status = 'on_the_way' AND v_old_status != 'accepted' THEN
        RAISE EXCEPTION 'Must be accepted first';
      END IF;
      IF p_new_status = 'arrived' AND v_old_status != 'on_the_way' THEN
        RAISE EXCEPTION 'Must be on the way first';
      END IF;
      IF p_new_status = 'resolved' AND v_old_status NOT IN ('arrived', 'on_the_way') THEN
        RAISE EXCEPTION 'Must be arrived or on the way to resolve';
      END IF;
    WHEN 'admin' THEN
      -- Admins can do any transition
      NULL;
    ELSE
      RAISE EXCEPTION 'Invalid role';
  END CASE;

  -- Update emergency
  UPDATE emergencies
  SET status = p_new_status,
      updated_at = NOW(),
      CASE
        WHEN p_new_status = 'resolved' THEN resolved_at = NOW()
        WHEN p_new_status = 'cancelled' THEN cancelled_at = NOW()
        WHEN p_new_status = 'arrived' THEN actual_arrival = NOW()
      END
  WHERE id = p_emergency_id;

  -- Log audit event
  PERFORM log_audit_event(
    p_user_id,
    'emergency_status_change',
    'emergency',
    p_emergency_id,
    jsonb_build_object('status', v_old_status),
    jsonb_build_object('status', p_new_status)
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event(
  p_user_id UUID DEFAULT NULL,
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_old_data JSONB DEFAULT NULL,
  p_new_data JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_data, new_data)
  VALUES (p_user_id, p_action, p_entity_type, p_entity_id, p_old_data, p_new_data);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (user_id, role, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'patient')::user_role,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE emergencies;
ALTER PUBLICATION supabase_realtime ADD TABLE emergency_responses;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE responders;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;