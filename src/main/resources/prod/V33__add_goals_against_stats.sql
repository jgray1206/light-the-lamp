ALTER TABLE "game" DROP COLUMN away_team_empty_netters;
ALTER TABLE "game" DROP COLUMN home_team_empty_netters;
ALTER TABLE "game" ADD COLUMN home_team_goalies_goals_against SMALLINT;
ALTER TABLE "game" ADD COLUMN away_team_goalies_goals_against SMALLINT;
UPDATE "game" SET home_team_goalies_goals_against = away_team_goals;
UPDATE "game" SET away_team_goalies_goals_against = home_team_goals;
