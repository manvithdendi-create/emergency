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
      Deno.env.get('SUPABAASE_URL') ?? '',
      Deno.env.get('UPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { userId, type, title, message, emergencyId, metadata } = await req.json()

    if (!userId || !type || !title || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create notification in database
    const { data: notification, error: notificationError } = await supabaseClient
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        emergency_id: emergencyId,
        metadata,
      })
      .select()
      .single()

    if (notificationError) throw notificationError

    // Get user's profile for potential push notification
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('push_token, device_type')
      .eq('id', userId)
      .single()

    // Here you would integrate with your push notification service
    // e.g., Firebase Cloud Messaging, Apple Push Notification Service, etc.
    if (profile?.push_token) {
      // await sendPushNotification(profile.push_token, title, message, { emergencyId, ...metadata })
      console.log(`Would send push notification to ${profile.device_type}: ${title}`)
    }

    return new Response(
      JSON.stringify({ notification }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})