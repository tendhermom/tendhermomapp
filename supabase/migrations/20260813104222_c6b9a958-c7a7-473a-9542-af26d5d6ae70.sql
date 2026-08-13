CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  DELETE FROM public.rate_limits
  WHERE (action <> 'ai_chat_free_week' AND created_at < now() - interval '24 hours')
     OR (action = 'ai_chat_free_week' AND created_at < now() - interval '14 days');
$function$;