# IMDBnator API

This repo contains the entire backend of IMDBnator which includes the API along with the movie data dumps.  

## Stack

The entire stack is a [Docker container](https://www.docker.com/what-container) which can be installed disjointly with touching your filesystem or services.

- Scripting: Python
- Database: MongoDB
- Search: Elasticsearch (along with Kibana & Logstash)
- Microservices: NodeJS

## Prerequisities

You will only require [Docker](https://www.docker.com/) to run the entire app as a container. Further, you will require atleast 8GB of RAM as the EKL stack is quite memory intensive.

- Install Docker: `curl -sSL https://get.docker.com/ | sh`
- Install Docker Compose: `curl -L "https://github.com/docker/compose/releases/download/1.17.1/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose && chmod +x /usr/local/bin/docker-compose`

If you wish to run `docker` and `docker-compose` on a windows machine you will need to follow another set of installation instructions as shown [here](https://docs.docker.com/docker-for-windows/install/#download-docker-for-windows)

## Installation

- `git clone https://github.com/saikrishnadeep/imdbnator-api.git`
- `cd imdbnator-api`
- `docker-compose up dump`

This will setup all the basic stack requirements and dump the entire imdb and tmdb movie databases for local development. You can have a look at the Dockerfile [`docker/dump`](https://github.com/saikrishnadeep/imdbnator-api/blob/master/docker/dump) and [`docker-compose.yml`](https://github.com/saikrishnadeep/imdbnator-api/blob/master/docker-compose.yml) to see the exact procedure.

The installation will take quite a long while as all the services EKL, MongoDB, NodeJS and the `~ 1 GB` movie dumps are downloaded. The final stage of the dumping process is indexing the data into Elasticsearch via Logstash. This process marks the last step of a dumping. You will see a message that would indicate that the process has started:

> Dumping in progress. Go to http://localhost:9200/_cat/indices?v to check if data is fully dumped.

If you visit [`http://localhost:9200/_cat/indices?v`](http://localhost:9200/_cat/indices?v) you should see indices `IMDb` and `TMDb` with the number of docs currently indexed. Depending on your system resources, it might take around 10 minutes or less to index the entire dump. If you notice that the number of docs arn't changing anymore, then it indicates that the data has been dumpped. As of this writing, you should close to `260,825` docs in `imdb` index and `349,306` docs in the `tmdb` index.

You can then press `Ctrl+C` and exit.

## Running

Once, you have the data dumpped. You can start the web service using.

- `docker-compose up api`

The default listening port is `8081`. Therefore, if you see a success message at [`http://localhost:8081/debug/echo/foo`](http://localhost:8081/debug/echo/foo). Then you're good to go and its all setup!

## Notes

- The default API endpoint is [`http://localhost:8081`](http://localhost:8081).
- The default elasticsearch endpoint is [`http://localhost:9200`](http://localhost:9200)
- The default IMDb index end point is [`http://localhost:9200/imdb/_search?pretty=true&q=*:*`](http://localhost:9200/imdb/_search?pretty=true&q=*:*)
- To check if the API is communicating with elasticsearch you can try a sample query like: [`http://localhost:8081/process/search?input=Batman vs Superman&mode=match&index=imdb&type=movie`](http://localhost:8081/process/search?input=Batman%20vs%20Superman&mode=match&index=imdb&type=movie)
- File changes made in the host `imdbnator-api` directory get mirrored into the containers.
- You can build a container for a service using `docker-compose build dump`
- To interact and work, glimpse inside a built container, you can use `docker run -it #CONTAINER_ID /bin/bash`
- The EKL and MongoDB data from the containers gets persisted even after the containers are shutdown or deleted at `./data` folder.
- The EKL config files are located at `./configs` to limit properties such as memory and processor usage by the EKL stack

## Resources

- [Docker resource allocation](https://docs.docker.com/engine/admin/resource_constraints/)
