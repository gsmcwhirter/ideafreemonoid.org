# About IdeaFreeMonoid

This project is actually the source code running on my personal website.
It contains an about page, a blog, a CV/resume, a custom continuous
integration server, and a visualization system using a java applet.

# Technology

The live system is set up behind a nginx frontend, primarily using
couchdb, a node.js backend, and redis.

The frontend is served as a couchapp, using ember.js to manage content 
loading etc.

The backend is an express app on node.js that talks to a worker process
over redis pub/sub.
