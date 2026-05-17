import type { ComponentTemplate, ComponentType } from '../../types/schema'
import { postgresTemplate } from './postgres'
import { redisTemplate } from './redis'
import { kafkaTemplate } from './kafka'
import { mysqlTemplate } from './mysql'

export const templates: Record<ComponentType, ComponentTemplate> = {
  postgres: postgresTemplate,
  redis: redisTemplate,
  kafka: kafkaTemplate,
  mysql: mysqlTemplate,
}
