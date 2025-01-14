CREATE INDEX game_season_home_team_id_away_team_id ON game (season, home_team_id, away_team_id);
CREATE INDEX game_season ON game (season);
