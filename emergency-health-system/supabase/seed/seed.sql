-- Seed data for Emergency Health Alert & Response System
-- Run this after running the main migration

-- Note: These users need to be created in Supabase Auth first
-- Then their profiles will be created via the trigger

-- Sample Hospitals
INSERT INTO hospitals (profile_id, name, license_number, address, city, state, zip_code, country, phone, email, latitude, longitude, emergency_capacity, current_load, accepts_ambulance, specialties, is_verified, is_active, operating_hours)
VALUES 
  -- Hospital 1
  (
    (SELECT id FROM profiles WHERE email = 'hospital@demo.com' LIMIT 1),
    'City General Hospital',
    'HOSP-001',
    '123 Main Street',
    'San Francisco',
    'CA',
    '94102',
    'US',
    '+1-415-555-0100',
    'emergency@citygeneral.org',
    37.7749,
    -122.4194,
    25,
    5,
    true,
    ARRAY['Trauma Center', 'Cardiology', 'Neurology', 'Pediatrics', 'Burn Unit'],
    true,
    true,
    '{"monday": {"open": "00:00", "close": "23:59"}, "tuesday": {"open": "00:00", "close": "23:59"}, "wednesday": {"open": "00:00", "close": "23:59"}, "thursday": {"open": "00:00", "close": "23:59"}, "friday": {"open": "00:00", "close": "23:59"}, "saturday": {"open": "00:00", "close": "23:59"}, "sunday": {"open": "00:00", "close": "23:59"}}'::jsonb
  ),
  -- Hospital 2
  (
    (SELECT id FROM profiles WHERE email = 'hospital2@demo.com' LIMIT 1),
    'Metro Medical Center',
    'HOSP-002',
    '456 Oak Avenue',
    'Oakland',
    'CA',
    '94612',
    'US',
    '+1-510-555-0200',
    'emergency@metromedical.org',
    37.8044,
    -122.2711,
    20,
    3,
    true,
    ARRAY['Emergency Medicine', 'Orthopedics', 'Stroke Center', 'ICU'],
    true,
    true,
    '{"monday": {"open": "00:00", "close": "23:59"}, "tuesday": {"open": "00:00", "close": "23:59"}, "wednesday": {"open": "00:00", "close": "23:59"}, "thursday": {"open": "00:00", "close": "23:59"}, "friday": {"open": "00:00", "close": "23:59"}, "saturday": {"open": "00:00", "close": "23:59"}, "sunday": {"open": "00:00", "close": "23:59"}}'::jsonb
  ),
  -- Hospital 3
  (
    (SELECT id FROM profiles WHERE email = 'hospital3@demo.com' LIMIT 1),
    'University Hospital',
    'HOSP-003',
    '789 University Drive',
    'Berkeley',
    'CA',
    '94704',
    'US',
    '+1-510-555-0300',
    'emergency@universityhospital.org',
    37.8719,
    -122.2585,
    30,
    8,
    true,
    ARRAY['Level 1 Trauma', 'Transplant', 'Oncology', 'Neurosurgery', 'NICU'],
    true,
    true,
    '{"monday": {"open": "00:00", "close": "23:59"}, "tuesday": {"open": "00:00", "close": "23:59"}, "wednesday": {"open": "00:00", "close": "23:59"}, "thursday": {"open": "00:00", "close": "23:59"}, "friday": {"open": "00:00", "close": "23:59"}, "saturday": {"open": "00:00", "close": "23:59"}, "sunday": {"open": "00:00", "close": "23:59"}}'::jsonb
  );

-- Sample Responders
INSERT INTO responders (profile_id, employee_id, hospital_id, license_number, certification_level, specialties, is_available, current_latitude, current_longitude, last_location_update, shift_start, shift_end, vehicle_type, vehicle_id)
VALUES 
  -- Responder 1
  (
    (SELECT id FROM profiles WHERE email = 'responder@demo.com' LIMIT 1),
    'MED-001',
    (SELECT id FROM hospitals WHERE license_number = 'HOSP-001' LIMIT 1),
    'LIC-EMT-001',
    'Paramedic',
    ARRAY['Advanced Cardiac Life Support', 'Pediatric Advanced Life Support', 'Trauma'],
    true,
    37.7849,
    -122.4094,
    NOW(),
    '06:00',
    '18:00',
    'ambulance',
    'AMB-101'
  ),
  -- Responder 2
  (
    (SELECT id FROM profiles WHERE email = 'responder2@demo.com' LIMIT 1),
    'MED-002',
    (SELECT id FROM hospitals WHERE license_number = 'HOSP-001' LIMIT 1),
    'LIC-EMT-002',
    'EMT',
    ARRAY['Basic Life Support', 'Emergency Vehicle Operations'],
    true,
    37.7749,
    -122.4294,
    NOW(),
    '06:00',
    '18:00',
    'ambulance',
    'AMB-102'
  ),
  -- Responder 3
  (
    (SELECT id FROM profiles WHERE email = 'responder3@demo.com' LIMIT 1),
    'MED-003',
    (SELECT id FROM hospitals WHERE license_number = 'HOSP-002' LIMIT 1),
    'LIC-EMT-003',
    'AEMT',
    ARRAY['Advanced Airway', 'IV Therapy', 'Cardiac Monitoring'],
    true,
    37.8144,
    -122.2811,
    NOW(),
    '14:00',
    '02:00',
    'medic_unit',
    'MED-201'
  ),
  -- Responder 4
  (
    (SELECT id FROM profiles WHERE email = 'responder4@demo.com' LIMIT 1),
    'MED-004',
    (SELECT id FROM hospitals WHERE license_number = 'HOSP-003' LIMIT 1),
    'LIC-EMT-004',
    'RN',
    ARRAY['Emergency Nursing', 'Trauma Nursing', 'Critical Care'],
    true,
    37.8819,
    -122.2685,
    NOW(),
    '22:00',
    '10:00',
    'supervisor',
    'SUP-301'
  );

-- Sample Patient Profiles (will be created via auth trigger)
-- Emergency Contacts for Patients
INSERT INTO emergency_contacts (patient_id, name, relationship, phone, email, is_primary)
SELECT 
  p.id,
  'Jane Doe',
  'Spouse',
  '+1-415-555-1001',
  'jane.doe@email.com',
  true
FROM profiles p WHERE p.email = 'patient@demo.com'
ON CONFLICT DO NOTHING;

INSERT INTO emergency_contacts (patient_id, name, relationship, phone, email, is_primary)
SELECT 
  p.id,
  'John Smith Sr.',
  'Parent',
  '+1-415-555-1002',
  'john.sr@email.com',
  false
FROM profiles p WHERE p.email = 'patient@demo.com'
ON CONFLICT DO NOTHING;

INSERT INTO emergency_contacts (patient_id, name, relationship, phone, email, is_primary)
SELECT 
  p.id,
  'Dr. Emily Wilson',
  'Physician',
  '+1-415-555-1003',
  'dr.wilson@clinic.com',
  false
FROM profiles p WHERE p.email = 'patient@demo.com'
ON CONFLICT DO NOTHING;

-- Sample Emergencies (for testing)
INSERT INTO emergencies (patient_id, hospital_id, responder_id, status, priority, chief_complaint, description, patient_latitude, patient_longitude, patient_address, hospital_latitude, hospital_longitude, responder_latitude, responder_longitude, created_at, updated_at)
VALUES 
  -- Emergency 1: Resolved
  (
    (SELECT id FROM profiles WHERE email = 'patient@demo.com' LIMIT 1),
    (SELECT id FROM hospitals WHERE license_number = 'HOSP-001' LIMIT 1),
    (SELECT id FROM responders WHERE employee_id = 'MED-001' LIMIT 1),
    'resolved',
    'high',
    'Chest Pain',
    'Patient experiencing severe chest pain radiating to left arm, shortness of breath, diaphoresis. History of hypertension.',
    37.7849,
    -122.4094,
    '100 Market St, San Francisco, CA 94102',
    37.7749,
    -122.4194,
    37.7849,
    -122.4094,
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days' + INTERVAL '45 minutes'
  ),
  -- Emergency 2: Active - On the way
  (
    (SELECT id FROM profiles WHERE email = 'patient2@demo.com' LIMIT 1),
    (SELECT id FROM hospitals WHERE license_number = 'HOSP-002' LIMIT 1),
    (SELECT id FROM responders WHERE employee_id = 'MED-003' LIMIT 1),
    'on_the_way',
    'critical',
    'Difficulty Breathing',
    'Patient with severe asthma attack, not responding to rescue inhaler. O2 sat 88%.',
    37.8144,
    -122.2811,
    '500 Broadway, Oakland, CA 94612',
    37.8044,
    -122.2711,
    37.8144,
    -122.2811,
    NOW() - INTERVAL '15 minutes',
    NOW() - INTERVAL '10 minutes'
  ),
  -- Emergency 3: Pending
  (
    (SELECT id FROM profiles WHERE email = 'patient3@demo.com' LIMIT 1),
    NULL,
    NULL,
    'pending',
    'high',
    'Severe Bleeding',
    'Deep laceration to right forearm from kitchen accident. Bleeding not controlled with direct pressure.',
    37.7949,
    -122.4194,
    '200 Mission St, San Francisco, CA 94105',
    NULL,
    NULL,
    NULL,
    NULL,
    NOW() - INTERVAL '5 minutes',
    NOW() - INTERVAL '5 minutes'
  );

-- Emergency Responses for the sample emergencies
INSERT INTO emergency_responses (emergency_id, responder_id, status, latitude, longitude, notes, vitals, created_at)
VALUES 
  -- Response for Emergency 1
  (
    (SELECT id FROM emergencies WHERE chief_complaint = 'Chest Pain' LIMIT 1),
    (SELECT id FROM responders WHERE employee_id = 'MED-001' LIMIT 1),
    'assigned',
    37.7849,
    -122.4094,
    'Dispatched to scene',
    '{}',
    NOW() - INTERVAL '2 days'
  ),
  (
    (SELECT id FROM emergencies WHERE chief_complaint = 'Chest Pain' LIMIT 1),
    (SELECT id FROM responders WHERE employee_id = 'MED-001' LIMIT 1),
    'en_route',
    37.7849,
    -122.4094,
    'En route to patient location',
    '{}',
    NOW() - INTERVAL '2 days' + INTERVAL '2 minutes'
  ),
  (
    (SELECT id FROM emergencies WHERE chief_complaint = 'Chest Pain' LIMIT 1),
    (SELECT id FROM responders WHERE employee_id = 'MED-001' LIMIT 1),
    'on_scene',
    37.7849,
    -122.4094,
    'Arrived on scene. Patient conscious, complaining of chest pain. Administered aspirin 325mg, oxygen 15L via NRB. IV established. ECG shows ST elevation in II, III, aVF.',
    '{"BP": "140/90", "HR": "98", "SpO2": "94", "RR": "22"}',
    NOW() - INTERVAL '2 days' + INTERVAL '8 minutes'
  ),
  (
    (SELECT id FROM emergencies WHERE chief_complaint = 'Chest Pain' LIMIT 1),
    (SELECT id FROM responders WHERE employee_id = 'MED-001' LIMIT 1),
    'transporting',
    37.7749,
    -122.4194,
    'Transporting to City General Hospital. Code 3. ETA 12 minutes.',
    '{"BP": "135/85", "HR": "92", "SpO2": "96", "RR": "20"}',
    NOW() - INTERVAL '2 days' + INTERVAL '20 minutes'
  ),
  (
    (SELECT id FROM emergencies WHERE chief_complaint = 'Chest Pain' LIMIT 1),
    (SELECT id FROM responders WHERE employee_id = 'MED-001' LIMIT 1),
    'at_hospital',
    37.7749,
    -122.4194,
    'Arrived at City General Hospital. Patient transferred to cath lab team.',
    '{"BP": "130/80", "HR": "88", "SpO2": "97", "RR": "18"}',
    NOW() - INTERVAL '2 days' + INTERVAL '35 minutes'
  ),
  (
    (SELECT id FROM emergencies WHERE chief_complaint = 'Chest Pain' LIMIT 1),
    (SELECT id FROM responders WHERE employee_id = 'MED-001' LIMIT 1),
    'completed',
    37.7749,
    -122.4194,
    'Patient handoff completed. Responder returned to service.',
    '{}',
    NOW() - INTERVAL '2 days' + INTERVAL '45 minutes'
  ),
  -- Response for Emergency 2
  (
    (SELECT id FROM emergencies WHERE chief_complaint = 'Difficulty Breathing' LIMIT 1),
    (SELECT id FROM responders WHERE employee_id = 'MED-003' LIMIT 1),
    'assigned',
    37.8144,
    -122.2811,
    'Dispatched to scene',
    '{}',
    NOW() - INTERVAL '15 minutes'
  ),
  (
    (SELECT id FROM emergencies WHERE chief_complaint = 'Difficulty Breathing' LIMIT 1),
    (SELECT id FROM responders WHERE employee_id = 'MED-003' LIMIT 1),
    'en_route',
    37.8144,
    -122.2811,
    'En route with lights and sirens. ETA 5 minutes.',
    '{}',
    NOW() - INTERVAL '10 minutes'
  );

-- Notifications for sample emergencies
INSERT INTO notifications (user_id, type, title, message, emergency_id, is_read, metadata)
SELECT 
  p.id,
  'emergency_created',
  'Emergency Alert Created',
  'Your SOS alert for Chest Pain has been sent to nearby hospitals.',
  e.id,
  false,
  '{"priority": "high"}'::jsonb
FROM profiles p, emergencies e 
WHERE p.email = 'patient@demo.com' AND e.chief_complaint = 'Chest Pain'
ON CONFLICT DO NOTHING;

INSERT INTO notifications (user_id, type, title, message, emergency_id, is_read, metadata)
SELECT 
  h.profile_id,
  'emergency_created',
  'New Emergency Alert',
  'Chest Pain - HIGH priority emergency near your hospital',
  e.id,
  false,
  '{"hospitalId": h.id, "distanceKm": 1.2}'::jsonb
FROM hospitals h, emergencies e 
WHERE h.license_number = 'HOSP-001' AND e.chief_complaint = 'Chest Pain'
ON CONFLICT DO NOTHING;

-- Sample audit logs
INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_data, new_data, ip_address, user_agent)
VALUES 
  (
    (SELECT id FROM profiles WHERE email = 'patient@demo.com' LIMIT 1),
    'emergency_created',
    'emergency',
    (SELECT id FROM emergencies WHERE chief_complaint = 'Chest Pain' LIMIT 1),
    NULL,
    '{"chief_complaint": "Chest Pain", "priority": "high", "status": "pending"}',
    '192.168.1.100',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)'
  ),
  (
    (SELECT id FROM profiles WHERE email = 'hospital@demo.com' LIMIT 1),
    'emergency_status_change',
    'emergency',
    (SELECT id FROM emergencies WHERE chief_complaint = 'Chest Pain' LIMIT 1),
    '{"status": "pending"}',
    '{"status": "accepted"}',
    '192.168.1.200',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
  ),
  (
    (SELECT id FROM profiles WHERE email = 'hospital@demo.com' LIMIT 1),
    'responder_assigned',
    'emergency',
    (SELECT id FROM emergencies WHERE chief_complaint = 'Chest Pain' LIMIT 1),
    NULL,
    '{"responder_id": "MED-001", "responder_name": "John Responder"}',
    '192.168.1.200',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
  ),
  (
    (SELECT id FROM profiles WHERE email = 'responder@demo.com' LIMIT 1),
    'emergency_status_change',
    'emergency',
    (SELECT id FROM emergencies WHERE chief_complaint = 'Chest Pain' LIMIT 1),
    '{"status": "accepted"}',
    '{"status": "on_the_way"}',
    '192.168.1.150',
    'Mozilla/5.0 (Linux; Android 13; Pixel 7)'
  );