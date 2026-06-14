import { createApp } from './app';

const app = createApp();
const PORT = 4000;

app.listen(PORT, () => {
  console.log(`后端服务运行于 http://localhost:${PORT}`);
});

export default app;
