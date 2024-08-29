CREATE TABLE "season" (id SERIAL PRIMARY KEY, season_name VARCHAR(32) NOT NULL, season_id VARCHAR(8) NOT NULL);
INSERT INTO "season" (season_name, season_id) VALUES
    ('2024-2025 Pre', '202401'),
    ('2023-2024 Post', '202303'),
    ('2023-2024', '202302'),
    ('2023-2024 Pre', '202301'),
    ('2022-2023 Post', '202203'),
    ('2022-2023', '202202');