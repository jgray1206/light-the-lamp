--num picks
select count(*) from public.pick p where team_id = 17 and game_id > '2024020000';
--num users
select count(*) from public.pick p where team_id = 17 and game_id > '2024020000' group by user_id;

--most points, top 3
select points, user_id, reddit_username, display_name
from public.user u
JOIN (
select sum(points) as points, user_id from public.pick p where team_id = 17 and game_id > '2024020000' group by user_id
order by sum(points) desc
) as p
on u.id = p.user_id
where reddit_username IS NOT NULL
order by points desc limit 6;

-- best player picker (most points from the players)
select points, user_id, reddit_username, display_name
from public.user u
JOIN (
select sum(points) as points, user_id from public.pick p where team_id = 17 and game_id > '2024020000'
and the_team is null group by user_id order by sum(points) desc
) as p
on u.id = p.user_id
where reddit_username IS NOT NULL
order by points desc limit 6;

--most consistent player picker
select p.count, name, user_id, reddit_username, display_name
from public.user u
JOIN (
select count(p), name, user_id
from public.pick p
join game_player gp ON p.game_player_id_player_id = gp.id_player_id and p.game_player_id_game_id = gp.id_game_id
where p.team_id = 17 and game_id > '2024020000' and the_team is null and goalies is null
group by user_id, name
) as p
on u.id = p.user_id
where reddit_username IS NOT NULL
order by p.count desc limit 6;

--most consistent team picker
select p.count, user_id, reddit_username, display_name
from public.user u
JOIN (
select count(p), user_id
from public.pick p
where p.team_id = 17 and game_id > '2024020000' and the_team = True
group by user_id
) as p
on u.id = p.user_id
where reddit_username IS NOT NULL
order by p.count desc limit 6;

--most consistent goalies picker
select p.count, user_id, reddit_username, display_name
from public.user u
JOIN (
select count(p), user_id
from public.pick p
where p.team_id = 17 and game_id > '2024020000' and goalies = True
group by user_id
) as p
on u.id = p.user_id
where reddit_username IS NOT NULL
order by p.count desc limit 3;

--least picked red wing
select count(p), name
from public.pick p
join game_player gp ON p.game_player_id_player_id = gp.id_player_id and p.game_player_id_game_id = gp.id_game_id
where p.team_id = 17 and game_id > '2024020000' and the_team is null and goalies is null and reddit_username IS NOT NULL
group by name order by p.count desc limit 3;

--most picked red wing
select count(p), name
from public.pick p
join game_player gp ON p.game_player_id_player_id = gp.id_player_id and p.game_player_id_game_id = gp.id_game_id
where p.team_id = 17 and game_id > '2024020000' and the_team is null and goalies is null and reddit_username IS NOT NULL
group by name order by p.count asc limit 3;

--perfect attendance
select p.count, user_id, reddit_username, display_name
from public.user u
JOIN (
select user_id, count(*) from public.pick p where team_id = 17 and game_id > '2024020000' group by user_id
having count(*) = 82
) as p
where reddit_username IS NOT NULL
on u.id = p.user_id;

--num picks by team
select count(*), MAX(team_name) from public.pick p
JOIN public.team ON team_id = id
where game_id > '2024020000' group by team_id;
