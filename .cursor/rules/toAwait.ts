/**
 * toAwait 统一处理异步请求函数
 * 用于简化异步请求的错误处理，避免重复写try/catch
 * @param promise 异步请求Promise
 * @returns [data, error] 元组，包含数据和错误信息
 */
export const toAwait = async <T, E = Error>(
  promise: Promise<T>
): Promise<[T | null, E | null]> => {
  try {
    const data = await promise;
    return [data, null];
  } catch (error) {
    return [null, error as E];
  }
};

/**
 * 使用示例:
 *
 * import http from './http'
 * import { toAwait } from './toAwait'
 *
 * const fetchData = async () => {
 *   const [data, error] = await toAwait(http.get('/api/data'))
 *
 *   if (error) {
 *     // 处理错误
 *     console.error('请求失败:', error)
 *     return
 *   }
 *
 *   // 使用数据
 *   console.log('请求成功:', data)
 * }
 */

export default toAwait;
