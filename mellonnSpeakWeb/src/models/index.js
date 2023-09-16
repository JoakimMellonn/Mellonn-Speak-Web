// @ts-check
import { initSchema } from '@aws-amplify/datastore';
import { schema } from './schema';

const PromotionType = {
  "REFERRER": "REFERRER",
  "REFERGROUP": "REFERGROUP",
  "BENEFIT": "BENEFIT",
  "DEV": "DEV",
  "PERIODS": "PERIODS"
};

const { Purchase, Referrer, Promotion, Settings, Version, Recording } = initSchema(schema);

export {
  Purchase,
  Referrer,
  Promotion,
  Settings,
  Version,
  Recording,
  PromotionType
};