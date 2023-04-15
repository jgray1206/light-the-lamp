ALTER TABLE "pick" RENAME COLUMN team TO the_team;
ALTER TABLE "pick" ADD COLUMN team_id BIGINT NOT NULL;
DROP TABLE "group";
DROP TABLE "user_group";
CREATE TABLE "user_user" (id SERIAL PRIMARY KEY, from_user BIGINT NOT NULL, to_user BIGINT NOT NULL);
CREATE TABLE "user_team" (id SERIAL PRIMARY KEY, team_id BIGINT NOT NULL, user_id BIGINT NOT NULL);

INSERT INTO "user_team" (user_id, team_id)
SELECT "id", "team_id"
FROM "user";

ALTER TABLE "user" DROP COLUMN "team_id";
