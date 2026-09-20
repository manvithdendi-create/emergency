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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { emergencyId, hospitalId } = await req.json()

    if (!emergencyId || !hospitalId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get emergency details
    const { data: emergency, error: emergencyError } = await supabaseClient
      .from('emergencies')
      .select('*')
      .eq('id', emergencyId)
      .single()

    if (emergencyError) throw emergencyError

    // Get available responders for this hospital
    const { data: responders, error: respondersError } = await supabaseClient.rpc('get_available_responders', {
      p_hospital_id: hospitalId,
      p_lat: emergency.patient_latitude,
      p_lng: emergency.patient_longitude,
      radius_km: 20,
    })

    if (respondersError) throw respondersError

    // Notify each available responder
    let notifiedCount = 0
    for (const responder of responders || []) {
      await supabaseClient.functions.invoke('send-notification', {
        body: {
          userId: responder.profile_id,
          type: 'responder_assigned',
          title: 'Emergency Assignment Available',
          message: `${emergency.chief_complaint} - ${emergency.priority.toUpperCase()} priority`,
          emergencyId: emergency.id,
          metadata: {
            hospitalId,
            distanceKm: responder.distance_km,
            patientLocation: {
              lat: emergency.patient_latitude,
              lng: emergency.patient_longitude,
            },
          },
        },
      })
      notifiedCount++
    }

    // Log audit event
    await supabaseClient.rpc('log_audit_event', {
      p_action: 'responders_notified',
      p_entity_type: 'emergency',
      p_entity_id: emergencyId,
      p_new_data: { responders_notified: notifiedCount },
    })

    return new Response(
      JSON.stringify({ success: true, respondersNotified: notifiedCount }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})