import Router from "koa-router";
import { Context } from "koa";
import { CozeAPI } from "@coze/api";

const router = new Router();

// 基本 GET 请求示例
router.get("/", async (ctx: Context) => {
  ctx.body = {
    status: "success",
    message: "欢迎使用 LearnChain-X API",
  };
});

const apiClient = new CozeAPI({
  token: "pat_dgQTjI4R6TvOvGpuK2Ft4D1OgB9h4b5MTtQd6PrAONwfgic3wDzoEQeLGBNoeGBN",
  baseURL: "https://api.coze.cn",
});

// POST 接口示例
router.post("/api/submit", async (ctx: Context) => {
  try {
    const data = ctx.request.body;

    // 这里可以添加数据验证逻辑
    if (!data) {
      ctx.status = 400;
      ctx.body = {
        status: "error",
        message: "请提供有效的数据",
      };
      return;
    }

    // 这里可以添加数据处理逻辑
    // 例如：保存到数据库、调用其他服务等

    // 返回处理结果
    ctx.status = 200;
    ctx.body = {
      status: "success",
      message: "数据提交成功",
      data: data,
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      status: "error",
      message: "服务器内部错误",
      error: error instanceof Error ? error.message : "未知错误",
    };
  }
});

// Coze API调用封装成POST请求
router.post("/api/coze", async (ctx: Context) => {
  try {
    const requestBody = ctx.request.body as any;
    const input = requestBody?.input || "";
    
    if (!input) {
      ctx.status = 400;
      ctx.body = {
        status: "error",
        message: "请提供输入内容",
      };
      return;
    }
    
    const res = await apiClient.workflows.runs.stream({
      workflow_id: "7494156103493287945",
      parameters: {
        input: input,
      },
    });
    
    ctx.status = 200;
    ctx.body = {
      status: "success",
      message: "Coze API调用成功",
      data: res,
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      status: "error",
      message: "调用Coze API失败",
      error: error instanceof Error ? error.message : "未知错误",
    };
  }
});

export default router;
