// lib/credentials.js — Service credentials registry

import chalk from 'chalk';

export const SERVICE_UIS = {
  'minio':         { url: 'http://localhost:9001',  label: 'MinIO Console' },
  'mongo-express': { url: 'http://localhost:8081',  label: 'Mongo Express' },
  'adminer':       { url: 'http://localhost:8080',  label: 'Adminer' },
  'rabbitmq':      { url: 'http://localhost:15672', label: 'RabbitMQ Management' },
  'kibana':        { url: 'http://localhost:5601',  label: 'Kibana' },
  'grafana':       { url: 'http://localhost:3000',  label: 'Grafana' },
  'jaeger':        { url: 'http://localhost:16686', label: 'Jaeger UI' },
  'mailpit':       { url: 'http://localhost:8025',  label: 'Mailpit' },
  'keycloak':      { url: 'http://localhost:8082',  label: 'Keycloak Admin' },
  'traefik':       { url: 'http://localhost:8083',  label: 'Traefik Dashboard' },
};

export const CRED_SERVICES = ['postgres', 'mysql', 'mongodb', 'redis', 'elasticsearch'];

const CREDS = {
  postgres: {
    local:  'postgresql://devuser:devpassword@localhost:5432/devdb',
    docker: 'postgresql://devuser:devpassword@postgres:5432/devdb',
    orm:    { prisma: 'DATABASE_URL', typeorm: 'DB_HOST=localhost / DB_PORT=5432' },
    hint:   'Compatible con Prisma, TypeORM, Sequelize',
  },
  mysql: {
    local:  'mysql://devuser:devpassword@localhost:3306/devdb',
    docker: 'mysql://devuser:devpassword@mysql:3306/devdb',
    hint:   'Compatible con TypeORM, Sequelize, Prisma',
  },
  mongodb: {
    local:  'mongodb://devuser:devpassword@localhost:27017/',
    docker: 'mongodb://devuser:devpassword@mongodb:27017/',
    hint:   'Compatible con Mongoose, Prisma (MongoDB connector)',
  },
  redis: {
    local:  'redis://localhost:6379',
    docker: 'redis://redis:6379',
    hint:   'Compatible con ioredis, bull, BullMQ, cache-manager',
  },
  elasticsearch: {
    local:  'http://localhost:9200',
    docker: 'http://elasticsearch:9200',
    hint:   'Compatible con @elastic/elasticsearch, Kibana',
  },
};

export function getCredential(service) {
  return CREDS[service] ?? null;
}

export function formatCredNote(service) {
  const c = CREDS[service];
  if (!c) return null;

  return [
    chalk.gray('En tu Mac (localhost) — Para desarrollo con node local:'),
    chalk.greenBright(`  ${c.local}`),
    '',
    chalk.gray('App dockerizada — Red interna infra_dev_network:'),
    chalk.yellow(`  ${c.docker}`),
    '',
    chalk.gray(`💡 ${c.hint ?? ''}`),
  ].join('\n');
}
