ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'deportivo' CHECK (plan IN ('funcional', 'personalizado', 'deportivo')),
  ADD COLUMN IF NOT EXISTS acceso_funcional_gratis boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.promote_waitlist_for_class(class_id_param integer, booking_date_param date, start_time_param time)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  class_capacity integer;
  confirmed_count integer;
  remaining_slots integer;
  promoted_count integer := 0;
  waitlist_booking_id bigint;
BEGIN
  SELECT capacity INTO class_capacity
  FROM public.classes
  WHERE id = class_id_param;

  IF class_capacity IS NULL THEN
    RETURN 0;
  END IF;

  SELECT COUNT(*) INTO confirmed_count
  FROM public.bookings
  WHERE class_id = class_id_param
    AND booking_date = booking_date_param
    AND status = 'confirmada';

  remaining_slots := class_capacity - confirmed_count;

  IF remaining_slots <= 0 THEN
    RETURN 0;
  END IF;

  LOOP
    SELECT id INTO waitlist_booking_id
    FROM public.bookings
    WHERE class_id = class_id_param
      AND booking_date = booking_date_param
      AND status = 'waitlist'
    ORDER BY created_at ASC
    LIMIT 1;

    EXIT WHEN waitlist_booking_id IS NULL OR remaining_slots <= 0;

    UPDATE public.bookings
    SET status = 'confirmada'
    WHERE id = waitlist_booking_id;

    promoted_count := promoted_count + 1;
    remaining_slots := remaining_slots - 1;
  END LOOP;

  RETURN promoted_count;
END;
$$;
