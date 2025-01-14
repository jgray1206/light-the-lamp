ALTER TABLE "pick" ADD COLUMN season VARCHAR(8);
UPDATE "pick" SET season = SUBSTR(cast(game_id as VARCHAR), 1, 6);
CREATE INDEX pick_team_id_season ON "pick" (team_id, season);
CREATE INDEX pick_user_id_team_id_season ON "pick" (user_id, team_id, season);
