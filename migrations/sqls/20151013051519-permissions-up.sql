CREATE TABLE permissions (
	id serial primary key,
	name VARCHAR(100),
	description text
);

CREATE TABLE user_permissions (
	permission_id int references permissions(id),
	user_id int references users(id),
	UNIQUE (permission_id,user_id)
);