-- Every request looks the user up with their friends and kids joined in
CREATE INDEX IF NOT EXISTS user_user_to_user ON user_user (to_user);
CREATE INDEX IF NOT EXISTS user_user_from_user ON user_user (from_user);
CREATE INDEX IF NOT EXISTS user_parent_id ON "user" (parent_id);
