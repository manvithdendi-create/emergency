import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('UPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { emergencyId } = await req.json()

    if (!emergencyId) {
      return new Response(
        JSON.stringify({ error: 'Missing emergencyId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get emergency details
    const { data: emergency, error: emergencyError } = await supabaseClient
      .from('emergencies')
      .select(`
        *,
        patient:profiles!emergencies_patient_id_fkey(full_name, phone, emergency_contacts(name, phone)),
        hospital:hospitals(*)
      `)
      .eq('id', emergencyId)
      .single()

    if (emergencyError) throw emergencyError

    // Find nearby hospitals
    const { data: hospitals, error: hospitalsError } = await supabaseClient.rpc('get_nearby_hospitals', {
      user_lat: emergency.patient_latitude,
      user_lng: emergency.patient_longitude,
      radius_km: 50,
      limit_count: 10,
    })

    if (hospitalsError) throw hospitalsError

    // Notify patient's emergency contacts
    if (emergency.patient?.emergency_contacts) {
      for (const contact of emergency.patient.emergency_contacts) {
        // In production, send SMS via Twilio, Vonage, etc.
        console.log(`SMS to ${contact.phone}: Emergency alert for ${emergency.patient.full_name}. ${emergency.chief_complaint} at ${emergency.patient_address || 'GPS location'}`)
      }
    }

    // Notify nearby hospitals via realtime
    for (const hospital of hospitals || []) {
      // Get hospital admin users
      const { data: hospitalProfile } = await supabaseClient
        .from('hospitals')
        .select('profile_id')
        .eq('id', hospital.id)
        .single()

      if (hospitalProfile) {
        await supabaseClient.functions.invoke('send-notification', {
          body: {
            userId: hospitalProfile.profile_id,
            type: 'emergency_created',
            title: 'New Emergency Alert',
            message: `${emergency.chief_complaint} - ${emergency.priority.toUpperCase()} priority`,
            emergencyId: emergency.id,
            metadata: {
              hospitalId: hospital.id,
              distanceKm: hospital.distance_km,
              patientLocation: {
                lat: emergency.patient_latitude,
                lng: emergency.patient_longitude,
              },
            },
          },
        })
      }
    }

    // Log audit event
    await supabaseClient.rpc('log_audit_event', {
      p_action: 'emergency_processed',
      p_entity_type: 'emergency',
      p_entity_id: emergencyId,
      p_new_data: { hospitals_notified: hospitals?.length || 0 },
    })

    return new Response(
      JSON.stringify({ 
        success: true, 
        hospitalsNotified: hospitals?.length || 0,
        contactsNotified: emergency.patient?.emergency_contacts?.length || 0,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})