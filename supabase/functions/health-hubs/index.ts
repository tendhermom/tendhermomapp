const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GOOGLE_MAPS_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY')

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (!GOOGLE_MAPS_API_KEY) {
    return new Response(JSON.stringify({ error: 'Google Maps API key not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const { latitude, longitude, keyword, radius = 5000, pagetoken } = await req.json()

    if (!latitude || !longitude) {
      return new Response(JSON.stringify({ error: 'latitude and longitude are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Build Google Places Nearby Search URL
    const params = new URLSearchParams({
      location: `${latitude},${longitude}`,
      radius: String(radius),
      type: 'hospital|health|pharmacy|doctor|physiotherapist',
      key: GOOGLE_MAPS_API_KEY,
    })

    if (keyword) params.set('keyword', keyword)
    if (pagetoken) params.set('pagetoken', pagetoken)

    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?${params}`
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) })
    const data = await response.json()

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Google Places API error:', data.status, data.error_message)
      return new Response(JSON.stringify({ error: data.error_message || data.status }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Transform results
    const results = (data.results || []).map((place: any) => ({
      place_id: place.place_id,
      name: place.name,
      address: place.vicinity,
      lat: place.geometry?.location?.lat,
      lng: place.geometry?.location?.lng,
      rating: place.rating || null,
      total_ratings: place.user_ratings_total || 0,
      open_now: place.opening_hours?.open_now ?? null,
      types: place.types || [],
      icon: place.icon,
      photo_ref: place.photos?.[0]?.photo_reference || null,
    }))

    return new Response(JSON.stringify({
      results,
      next_page_token: data.next_page_token || null,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Health Hubs error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
