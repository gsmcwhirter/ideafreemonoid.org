CREATE TABLE users (
	id serial primary key,
	username VARCHAR(255) NOT NULL,
	email VARCHAR(255) NOT NULL,
	joined_on timestamp not null,
	banned boolean not null default false,
	banned_on timestamp,
	banned_reason text
);

CREATE TYPE external_source as ENUM('google','github','twitter','facebook');
CREATE TABLE external_accounts (
	id serial primary key,
	user_id int references users(id),
	source external_source not null
);

CREATE VIEW user_logins AS
	SELECT users.id FROM users 
					LEFT JOIN external_accounts on external_accounts.user_id = users.id;