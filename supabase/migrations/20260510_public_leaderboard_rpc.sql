create or replace function public.get_public_leaderboard(
  sort_mode text default 'season',
  result_limit integer default null
)
returns table (
  id uuid,
  pseudo text,
  season_points integer,
  all_time_points integer
)
language sql
security definer
set search_path = public
as $$
  select
    pr.id,
    pr.pseudo,
    coalesce(pr.season_points, 0)::integer as season_points,
    coalesce(pr.all_time_points, 0)::integer as all_time_points
  from public.profiles pr
  where coalesce(pr.pseudo, '') <> ''
  order by
    case
      when lower(coalesce(sort_mode, 'season')) = 'alltime'
        then coalesce(pr.all_time_points, 0)
      else coalesce(pr.season_points, 0)
    end desc,
    lower(pr.pseudo) asc
  limit case
    when result_limit is null or result_limit < 1 then null
    else result_limit
  end;
$$;

revoke all on function public.get_public_leaderboard(text, integer) from public;
grant execute on function public.get_public_leaderboard(text, integer) to anon, authenticated;
