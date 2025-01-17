CREATE INDEX user_team_user_id_team_id ON user_team (user_id, team_id);
CREATE INDEX user_team_team_id ON user_team (team_id);
CREATE INDEX game_date ON game ("date");
