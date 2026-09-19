CREATE TABLE IF NOT EXISTS public.push_delivery_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.activity_events(id) ON DELETE CASCADE,
  subscription_id uuid NOT NULL REFERENCES public.push_subscriptions(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'discarded')),
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, subscription_id)
);

CREATE INDEX IF NOT EXISTS push_delivery_queue_due_idx
  ON public.push_delivery_queue (status, next_attempt_at);

ALTER TABLE public.push_delivery_queue ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.push_delivery_queue FROM anon, authenticated;
GRANT ALL ON TABLE public.push_delivery_queue TO service_role;
