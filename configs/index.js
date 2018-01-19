module.exports =
{
  web: process.env.WEB_URL || '*',
  port: process.env.API_PORT || 8081,
  elasticsearch: process.env.ELASTICSEARCH_HOST || 'localhost:9200',
  mongodb: process.env.MONGODB_HOST || 'localhost:27017',
  maxListeners: 30
}
