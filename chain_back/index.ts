import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import router from './routes';

const app = new Koa();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(bodyParser());

// 路由
app.use(router.routes());
app.use(router.allowedMethods());

// 错误处理
app.on('error', (err, ctx) => {
  console.error('server error', err, ctx);
});

app.listen(PORT, () => {
  console.log(`服务器已启动，监听端口 ${PORT}`);
});
