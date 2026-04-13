delete from public.predictions older
using public.predictions newer
where older.user_id = newer.user_id
  and older.match_id = newer.match_id
  and older.ctid < newer.ctid;

create unique index if not exists predictions_user_match_unique_idx
on public.predictions (user_id, match_id);

create or replace function public.submit_event_predictions(
  event_id_input uuid,
  predictions_input jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  total_match_count integer;
  payload_count integer;
  distinct_match_count integer;
  filled_prediction_count integer;
  valid_match_count integer;
  existing_prediction_count integer;
begin
  if current_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if predictions_input is null or jsonb_typeof(predictions_input) <> 'array' then
    raise exception 'INVALID_PREDICTIONS_SET';
  end if;

  if not exists (
    select 1
    from public.events
    where id = event_id_input
      and coalesce(is_open, false) = true
      and now() <= coalesce(ends_at, starts_at)
  ) then
    raise exception 'EVENT_CLOSED';
  end if;

  select count(*)
  into total_match_count
  from public.matches
  where event_id = event_id_input;

  if total_match_count = 0 then
    raise exception 'INVALID_EVENT';
  end if;

  with payload as (
    select
      (item->>'match_id')::uuid as match_id,
      nullif(trim(coalesce(item->>'prediction', '')), '') as prediction
    from jsonb_array_elements(predictions_input) item
  )
  select
    count(*),
    count(distinct match_id),
    count(*) filter (where prediction is not null),
    count(*) filter (
      where exists (
        select 1
        from public.matches m
        where m.id = payload.match_id
          and m.event_id = event_id_input
      )
    )
  into
    payload_count,
    distinct_match_count,
    filled_prediction_count,
    valid_match_count
  from payload;

  if payload_count <> total_match_count
     or distinct_match_count <> total_match_count
     or filled_prediction_count <> total_match_count
     or valid_match_count <> total_match_count then
    raise exception 'INVALID_PREDICTIONS_SET';
  end if;

  select count(*)
  into existing_prediction_count
  from public.predictions p
  join public.matches m
    on m.id = p.match_id
  where p.user_id = current_user_id
    and m.event_id = event_id_input;

  if existing_prediction_count >= total_match_count then
    raise exception 'ALREADY_SUBMITTED';
  end if;

  if existing_prediction_count > 0 then
    delete from public.predictions p
    using public.matches m
    where p.match_id = m.id
      and p.user_id = current_user_id
      and m.event_id = event_id_input;
  end if;

  insert into public.predictions (user_id, match_id, prediction)
  select
    current_user_id,
    (item->>'match_id')::uuid,
    trim(coalesce(item->>'prediction', ''))
  from jsonb_array_elements(predictions_input) item;
end;
$$;

grant execute on function public.submit_event_predictions(uuid, jsonb) to authenticated;
