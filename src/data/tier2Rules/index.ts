import type { ComponentType, Tier2Rule } from '../../types/schema'
import { postgresRules } from './postgres.rules'
import { redisRules } from './redis.rules'
import { kafkaRules } from './kafka.rules'
import { mysqlRules } from './mysql.rules'

export const rulesByType: Record<ComponentType, Tier2Rule[]> = {
  postgres: postgresRules,
  redis: redisRules,
  kafka: kafkaRules,
  mysql: mysqlRules,
}
