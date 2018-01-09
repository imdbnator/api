GREEN="\e[32m"
NC="\033[0m"
temp=`readlink -f temp`
logstash=`readlink -f logstash`

rm -rf "$temp"
mkdir "$temp"
#
# echo -e "\n${GREEN}Downloading dumps${NC}\n"
# wget https://nyc3.digitaloceanspaces.com/imdbnator/imdb.movies.tar.gz -P "$temp"
# wget https://nyc3.digitaloceanspaces.com/imdbnator/tmdb.movies.tar.gz -P "$temp"
#
# echo -e "\n${GREEN}Extracting dumps${NC}\n"
# tar xvzf "$temp/imdb.movies.tar.gz" -C "$temp"
# tar xvzf "$temp/tmdb.movies.tar.gz" -C "$temp"
#
# echo -e "\n${GREEN}Validating and Parsing dumps${NC}\n"
#
# cd scripts
# virtualenv env
# source env/bin/activate
# pip install -r requirements.txt
# python parser.py tmdb movies "$temp/tmdb.movies" "$temp"
# python parser.py imdb movies "$temp/imdb.movies" "$temp"
# deactivate
# cd ..

echo -e "\n${GREEN}Dumping TMDb movies${NC}\n"
# https://stackoverflow.com/questions/15171622/mongoimport-of-json-file
mongoimport --db imdbnator --collection tmdb_movies --file "$temp/tmdb.movies.sanitized" --drop

echo -e "\n${GREEN}Dumping IMDb movies${NC}\n"
# https://stackoverflow.com/questions/15171622/mongoimport-of-json-file
mongoimport --db imdbnator --collection imdb_movies --file "$temp/imdb.movies.sanitized" --drop

echo -e "\n${GREEN}Deleting Indices${NC}\n"
base_config=`readlink -f logstash.cfg`

config1="tmdb.movies.titles.cfg"
index="tmdb"
type="movie"

cp -rf "$base_config" "$config1"
regex1="s#{DUMP_LOCATION}#$temp/tmdb.movies.titles#g"
regex2="s#{INDEX}#$index#g"
regex3="s#{TYPE}#$type#g"
sed -i -e "$regex1" -e "$regex2" -e "$regex3" "$config1"
curl -XDELETE "http://imdbnator-elasticsearch:9200/$index"

config2="imdb.movies.titles.cfg"
index="imdb"
type="movie"

cp -rf "$base_config" "$config2"
regex1="s#{DUMP_LOCATION}#$temp/imdb.movies.titles#g"
regex2="s#{INDEX}#$index#g"
regex3="s#{TYPE}#$type#g"
sed -i -e "$regex1" -e "$regex2" -e "$regex3" "$config2"
curl -XDELETE "http://imdbnator-elasticsearch:9200/$index"

# End
echo -e "\n\n${GREEN}All done! Ready for indexing.${NC} Please run the following for indexing.\n"
/usr/share/logstash/bin/logstash -f $config1
/usr/share/logstash/bin/logstash -f $config2
