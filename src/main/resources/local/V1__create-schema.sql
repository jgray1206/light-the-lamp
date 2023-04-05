CREATE SCHEMA IF NOT EXISTS dbo;
SET SCHEMA dbo;
CREATE TABLE "user" (id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY, email VARCHAR(50) NOT NULL, password VARCHAR(60) NOT NULL, confirmed BIT, locked BIT, attempts SMALLINT, ip_address VARCHAR(47) NOT NULL, confirmation_uuid VARCHAR(36) NOT NULL);
CREATE TABLE "group" (id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY, uuid VARCHAR(36) NOT NULL, create_user VARCHAR(50) NOT NULL , team_id BIGINT NOT NULL, name VARCHAR(128) NOT NULL);
CREATE TABLE "user_group" (id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY, user_id BIGINT NOT NULL, group_id BIGINT NOT NULL, score SMALLINT);
CREATE TABLE "team" (id BIGINT NOT NULL PRIMARY KEY, team_name VARCHAR(128) NOT NULL);
CREATE TABLE "game" (id BIGINT NOT NULL PRIMARY KEY, "date" TIMESTAMP NOT NULL, game_state VARCHAR(20) NOT NULL, home_team_id BIGINT NOT NULL, away_team_id BIGINT NOT NULL, home_team_goals SMALLINT, away_team_goals SMALLINT);
CREATE TABLE "game_player" (id_game_id BIGINT NOT NULL, id_player_id BIGINT NOT NULL, team_id BIGINT NOT NULL, position VARCHAR(20) NOT NULL, "name" VARCHAR(256) NOT NULL, goals SMALLINT, assists SMALLINT, short_goals SMALLINT, short_assists SMALLINT, goals_against SMALLINT, time_on_ice VARCHAR(8),  PRIMARY KEY(id_game_id, id_player_id));
CREATE TABLE "pick" (id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY, group_id BIGINT NOT NULL, user_id BIGINT NOT NULL, game_id BIGINT NOT NULL, game_player_id_game_id BIGINT, game_player_id_player_id BIGINT, goalies BIT, team BIT, points SMALLINT);

