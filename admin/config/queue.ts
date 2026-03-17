import env from '#start/env'

const queueConfig = {
  connection: {
    host: env.get('REDIS_HOST'),
    port: env.get('REDIS_PORT') ?? 6379,
    password: env.get('REDIS_PASSWORD'),
  },
}

export default queueConfig
