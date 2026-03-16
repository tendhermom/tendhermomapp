-- Create atomic points award function
CREATE OR REPLACE FUNCTION public.award_community_points(
  _user_id uuid,
  _points_to_add integer,
  _field text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  -- Upsert: create row if not exists, then atomically increment
  INSERT INTO public.community_points (user_id, points, posts_count, likes_count, comments_count)
  VALUES (_user_id, _points_to_add,
    CASE WHEN _field = 'posts_count' THEN 1 ELSE 0 END,
    CASE WHEN _field = 'likes_count' THEN 1 ELSE 0 END,
    CASE WHEN _field = 'comments_count' THEN 1 ELSE 0 END
  )
  ON CONFLICT (user_id) DO UPDATE SET
    points = community_points.points + _points_to_add,
    posts_count = community_points.posts_count + CASE WHEN _field = 'posts_count' THEN 1 ELSE 0 END,
    likes_count = community_points.likes_count + CASE WHEN _field = 'likes_count' THEN 1 ELSE 0 END,
    comments_count = community_points.comments_count + CASE WHEN _field = 'comments_count' THEN 1 ELSE 0 END,
    updated_at = now();

  SELECT row_to_json(cp) INTO result
  FROM community_points cp
  WHERE cp.user_id = _user_id;

  RETURN result;
END;
$$;

-- Add unique constraint on user_id if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'community_points_user_id_key'
  ) THEN
    ALTER TABLE public.community_points ADD CONSTRAINT community_points_user_id_key UNIQUE (user_id);
  END IF;
END $$;