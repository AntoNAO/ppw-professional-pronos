create or replace function public.increment_user_points(
  user_id_input uuid,
  increment_value integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set
    season_points = coalesce(season_points, 0) + increment_value,
    all_time_points = coalesce(all_time_points, 0) + increment_value
  where id = user_id_input;
end;
$$;

grant execute on function public.increment_user_points(uuid, integer) to authenticated;

create or replace function public.sync_profile_points()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set
    season_points = 0,
    all_time_points = 0
  where true;

  with totals as (
    select
      p.user_id,
      coalesce(sum(coalesce(p.correct_answers, 0)), 0)::integer as total_points
    from public.predictions p
    group by p.user_id
  )
  update public.profiles pr
  set
    season_points = totals.total_points,
    all_time_points = totals.total_points
  from totals
  where pr.id = totals.user_id;
end;
$$;

grant execute on function public.sync_profile_points() to authenticated;

create or replace function public.sync_profile_titles()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  season_max integer;
  all_time_max integer;
begin
  update public.profiles
  set
    ppw_world_titles = 0,
    ple_titles = 0,
    all_time_titles = 0,
    ple_best_player = 0
  where true;

  select coalesce(max(season_points), 0)::integer
  into season_max
  from public.profiles;

  if season_max > 0 then
    update public.profiles
    set ppw_world_titles = 1
    where coalesce(season_points, 0) = season_max;
  end if;

  select coalesce(max(all_time_points), 0)::integer
  into all_time_max
  from public.profiles;

  if all_time_max > 0 then
    update public.profiles
    set all_time_titles = 1
    where coalesce(all_time_points, 0) = all_time_max;
  end if;

  with ple_events as (
    select e.id
    from public.events e
    where coalesce(e.is_ple, false) = true
       or coalesce(e.is_big_event, false) = true
  ),
  event_scores as (
    select
      m.event_id,
      p.user_id,
      coalesce(sum(coalesce(p.correct_answers, 0)), 0)::integer as score
    from public.matches m
    join public.predictions p on p.match_id = m.id
    where m.event_id in (select id from ple_events)
    group by m.event_id, p.user_id
  ),
  event_max as (
    select
      es.event_id,
      max(es.score)::integer as max_score
    from event_scores es
    group by es.event_id
  ),
  event_winners as (
    select
      es.event_id,
      es.user_id
    from event_scores es
    join event_max em
      on em.event_id = es.event_id
     and em.max_score = es.score
    where em.max_score > 0
  ),
  ple_counts as (
    select
      ew.user_id,
      count(*)::integer as ple_total
    from event_winners ew
    group by ew.user_id
  )
  update public.profiles pr
  set
    ple_titles = coalesce(pc.ple_total, 0),
    ple_best_player = coalesce(pc.ple_total, 0)
  from ple_counts pc
  where pr.id = pc.user_id;
end;
$$;

grant execute on function public.sync_profile_titles() to authenticated;

create or replace function public.score_event(event_id_input uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.predictions p
  set
    is_correct = lower(btrim(p.prediction)) = lower(btrim(m.winner)),
    correct_answers = case
      when lower(btrim(p.prediction)) = lower(btrim(m.winner)) then 1
      else 0
    end
  from public.matches m
  where p.match_id = m.id
    and m.event_id = event_id_input
    and m.winner is not null;

  perform public.sync_profile_points();
  perform public.sync_profile_titles();
end;
$$;

grant execute on function public.score_event(uuid) to authenticated;
