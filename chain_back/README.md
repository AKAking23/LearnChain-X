# LearnChain-X 后端服务

基于 Koa 框架的 TypeScript 后端服务。

## 功能

- 提供 RESTful API 接口
- 支持 POST 请求数据处理

## 安装

```bash
# 安装依赖
npm install

# 或使用 yarn
yarn install
```

## 运行

```bash
# 开发模式运行
npm run dev

# 或使用 yarn
yarn dev

# 生产模式运行
npm start

# 或使用 yarn
yarn start
```

## API 接口

### GET /

基本健康检查接口，返回欢迎信息。

### POST /api/submit

提交数据接口。

请求体示例:

```json
{
  "name": "测试用户",
  "data": "测试数据"
}
```

成功响应示例:

```json
{
  "status": "success",
  "message": "数据提交成功",
  "data": {
    "name": "测试用户",
    "data": "测试数据"
  }
}
```

## 错误处理

接口会返回适当的 HTTP 状态码和错误信息。 