CREATE INDEX game_home_team_id_away_team_id ON game (home_team_id, away_team_id);
CREATE INDEX user_email ON "user" (email);
CREATE INDEX pick_user_id ON "pick" (user_id);
