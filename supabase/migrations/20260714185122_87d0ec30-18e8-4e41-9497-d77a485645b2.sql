
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS gift_account_name text,
  ADD COLUMN IF NOT EXISTS gift_account_number text,
  ADD COLUMN IF NOT EXISTS gift_bank_name text;

CREATE OR REPLACE FUNCTION public.get_gift_account(_user_id uuid)
RETURNS TABLE (
  account_name text,
  account_number text,
  bank_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT gift_account_name, gift_account_number, gift_bank_name
  FROM public.profiles
  WHERE id = _user_id
    AND gift_account_name IS NOT NULL AND length(trim(gift_account_name)) > 0
    AND gift_account_number IS NOT NULL AND length(trim(gift_account_number)) > 0
    AND gift_bank_name IS NOT NULL AND length(trim(gift_bank_name)) > 0
$$;

REVOKE ALL ON FUNCTION public.get_gift_account(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_gift_account(uuid) TO authenticated;
