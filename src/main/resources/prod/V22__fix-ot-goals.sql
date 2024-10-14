ALTER TABLE "game_player" DROP COLUMN ot_winner;
ALTER TABLE "game_player" ADD COLUMN ot_goals SMALLINT;
ALTER TABLE "game_player" ADD COLUMN ot_short_goals SMALLINT;