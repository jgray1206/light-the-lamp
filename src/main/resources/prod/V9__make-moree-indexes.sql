CREATE INDEX pick_user_id_team_id_game_id ON "pick" (user_id, team_id, game_id);
CREATE INDEX pick_team_id_game_id ON "pick" (team_id, game_id);
