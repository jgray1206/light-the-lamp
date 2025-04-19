--num picks
select count(*) from public.pick p where team_id = 17 and game_id > '2024020000';
--num users
select count(*) from (select count(*) from public.pick p where team_id = 17 and game_id > '2024020000' group by user_id) subquer;

--most points, top 6
select points,  reddit_username
from public.user u
JOIN (
select sum(points) as points, user_id from public.pick p where team_id = 17 and game_id > '2024020000' group by user_id
order by sum(points) desc
) as p
on u.id = p.user_id
where reddit_username IS NOT NULL AND reddit_username != ''
order by points desc limit 6;

-- best player picker (most points from the players)
select points,  reddit_username
from public.user u
JOIN (
select sum(points) as points, user_id from public.pick p where team_id = 17 and game_id > '2024020000'
and the_team is null and goalies is null group by user_id order by sum(points) desc
) as p
on u.id = p.user_id
where reddit_username IS NOT NULL AND reddit_username != ''
order by points desc limit 6;

--most consistent player picker
select p.count, name,  reddit_username
from public.user u
JOIN (
select count(p), name, user_id
from public.pick p
join game_player gp ON p.game_player_id_player_id = gp.id_player_id and p.game_player_id_game_id = gp.id_game_id
where p.team_id = 17 and game_id > '2024020000' and the_team is null and goalies is null
group by  name
) as p
on u.id = p.user_id
where reddit_username IS NOT NULL AND reddit_username != ''
order by p.count desc limit 6;

-- best team picker
select points,  reddit_username
from public.user u
JOIN (
select sum(points) as points, user_id from public.pick p where team_id = 17 and game_id > '2024020000'
and the_team = true group by user_id order by sum(points) desc
) as p
on u.id = p.user_id
where reddit_username IS NOT NULL AND reddit_username != ''
order by points desc limit 6;

-- best goalie picker
select points,  reddit_username
from public.user u
JOIN (
select sum(points) as points, user_id from public.pick p where team_id = 17 and game_id > '2024020000'
and goalies = true group by user_id order by sum(points) desc
) as p
on u.id = p.user_id
where reddit_username IS NOT NULL AND reddit_username != ''
order by points desc limit 6;

--least picked red wing
select count(p), name
from public.pick p
join game_player gp ON p.game_player_id_player_id = gp.id_player_id and p.game_player_id_game_id = gp.id_game_id
where p.team_id = 17 and game_id > '2024020000' and the_team is null and goalies is null
group by name order by p.count desc limit 3;

--most picked red wing
select count(p), name
from public.pick p
join game_player gp ON p.game_player_id_player_id = gp.id_player_id and p.game_player_id_game_id = gp.id_game_id
where p.team_id = 17 and game_id > '2024020000' and the_team is null and goalies is null
group by name order by p.count asc limit 3;

--perfect attendance
select p.count, reddit_username
from public.user u
JOIN (
select  count(*) from public.pick p where team_id = 17 and game_id > '2024020000' group by user_id
having count(*) = 82
) as p
on u.id = p.user_id
where reddit_username IS NOT NULL AND reddit_username != '';

-- most potent pickers
select point_per_pick, pick_count, reddit_username, point_per_pick*82 as projected_points
from public.user u
JOIN (
select cast(sum(points) as decimal)/count(*) as point_per_pick, count(*) as pick_count, user_id from public.pick p where team_id = 17 and game_id > '2024020000' group by user_id
having count(*) > 5
order by point_per_pick desc
) as p
on u.id = p.user_id
where reddit_username IS NOT NULL AND reddit_username != ''
order by point_per_pick desc limit 6;