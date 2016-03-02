#!/usr/bin/env bash

# Drops connections to database that might prevent us from recreating the db.
service postgresql restart

# Drops and creates osm database.
dropdb osm
createdb --owner='osm' 'osm'

# OSM specific native functions.
psql -d osm -c "CREATE FUNCTION maptile_for_point(int8, int8, int4) RETURNS int4 AS '/opt/osm/osm-web/db/functions/libpgosm', 'maptile_for_point' LANGUAGE C STRICT"
psql -d osm -c "CREATE FUNCTION tile_for_point(int4, int4) RETURNS int8 AS '/opt/osm/osm-web/db/functions/libpgosm', 'tile_for_point' LANGUAGE C STRICT"
psql -d osm -c "CREATE FUNCTION xid_to_int4(xid) RETURNS int4 AS '/opt/osm/osm-web/db/functions/libpgosm', 'xid_to_int4' LANGUAGE C STRICT"

echo "api-db-drop-create.sh : The API DB has been dropped and recreated."