import { resolve } from 'node:path';
import { createApp } from './index';

const port = Number(process.env.PORT || 3000);
const app = createApp(resolve('dist'));

app.listen(port, () => {
  console.info(`SectionForge API listening on port ${port}.`);
});
