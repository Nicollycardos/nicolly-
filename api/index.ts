import express from 'express';
import { apiRouter } from '../server/routes.js';

const app = express();
app.use(express.json());
app.use('/api', apiRouter);
// Also allow direct mount at /
app.use('/', apiRouter);

export default app;
