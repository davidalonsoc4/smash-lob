-- v1.8.0: mano dominante global obligatoria para completar el perfil.
ALTER TABLE public.app_users
  ADD COLUMN IF NOT EXISTS dominant_hand text;

ALTER TABLE public.app_users
  DROP CONSTRAINT IF EXISTS app_users_dominant_hand_check;

ALTER TABLE public.app_users
  ADD CONSTRAINT app_users_dominant_hand_check
  CHECK (dominant_hand IS NULL OR dominant_hand IN ('right', 'left'));
