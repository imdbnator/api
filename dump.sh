GREEN="\e[32m"
NC="\033[0m"

# Import IMDb and TMDb movie dumps into mongodb
# https://stackoverflow.com/questions/15171622/mongoimport-of-json-file
echo -e "\n${GREEN}Dumping TMDb movies${NC}\n"
mongoimport --host imdbnator-mongodb:27017 --db imdbnator --collection tmdb_movies --file "temp/tmdb.movies.sanitized" --drop
echo -e "\n${GREEN}Dumping IMDb movies${NC}\n"
mongoimport --host imdbnator-mongodb:27017 --db imdbnator --collection imdb_movies --file "temp/imdb.movies.sanitized" --drop

# Delete existing elasticsearch indices
echo -e "\n${GREEN}Deleting Indices.${NC}\n"
curl -XDELETE "http://imdbnator-elasticsearch:9200/imdb"
curl -XDELETE "http://imdbnator-elasticsearch:9200/tmdb"

# Import IMDB and TMDB dumps into elasticsearch using Logstash
echo -e "\n\n${GREEN}Dumping in progress. Go to http://localhost:9200/_cat/indices?v to check if data is fully dumped.${NC}\n"
logstash --log.level=fatal
