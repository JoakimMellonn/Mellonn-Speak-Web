// @ts-check
import { initSchema } from '@aws-amplify/datastore';
import { schema } from './schema';



const { Settings, Version, Recording } = initSchema(schema);

export {
  Settings,
  Version,
  Recording
};