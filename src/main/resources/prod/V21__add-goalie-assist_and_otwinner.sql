ALTER TABLE "game" ADD COLUMN away_team_goalie_assists SMALLINT;
ALTER TABLE "game" ADD COLUMN home_team_goalie_assists SMALLINT;
ALTER TABLE "game_player" ADD COLUMN ot_winner BOOLEAN;