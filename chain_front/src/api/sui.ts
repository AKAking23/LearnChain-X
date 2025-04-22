import { Transaction } from "@mysten/sui/transactions";
import { TESTNET_COUNTER_PACKAGE_ID } from "@/utils/constants";
// 合约地址
// export const CONTRACT_ADDRESS = '0x20cded4f9df05e37b44e3be2ffa9004dec77786950719fad6083694fdca45bf2'; // 需要替换为实际部署的合约地址
export const CONTRACT_ADDRESS = TESTNET_COUNTER_PACKAGE_ID;

/**
 * 创建交易对象用于回答正确后奖励积分
 * @param quizManagerId - Quiz管理器ID
 * @param userAddress - 用户地址
 * @param questionId - 问题ID
 * @param points - 奖励积分数量
 * @returns 交易对象
 */
export function createRewardTransaction(
  quizManagerId: string,
  userAddress: string,
  questionId: number,
  points: number
): Transaction {
  const tx = new Transaction();

  tx.moveCall({
    target: `${CONTRACT_ADDRESS}::point_token::reward_correct_answer`,
    arguments: [
      tx.object(quizManagerId), // Quiz管理器实例
      tx.pure.address(userAddress), // 用户地址
      tx.pure.u64(questionId), // 问题ID
      tx.pure.u64(points), // 奖励的积分数量
    ],
  });

  return tx;
}

/**
 * 创建交易对象用于直接奖励用户积分（使用direct_reward方法）
 * @param quizManagerId - Quiz管理器ID
 * @param userAddress - 用户地址
 * @param amount - 奖励积分数量
 * @returns 交易对象
 */
export function createDirectRewardTransaction(
  quizManagerId: string,
  userAddress: string,
  amount: number
): Transaction {
  const tx = new Transaction();

  tx.moveCall({
    target: `${CONTRACT_ADDRESS}::quiz::direct_reward`,
    arguments: [
      tx.object(quizManagerId), // Quiz管理器实例
      tx.pure.address(userAddress), // 接收代币的用户地址
      tx.pure.u64(amount), // 奖励数量
    ],
  });

  return tx;
}

/**
 * 创建交易对象用于查看题目解析（使用简化方法）
 * 调用新添加的view_solution_simple方法，不需要传入问题ID
 * @param payment - 用户积分代币ID
 * @param amount - 要销毁的积分数量
 * @returns 交易对象
 */
export function createViewSolutionSimpleTransaction(
  payment: string,
  amount: number
): Transaction {
  const tx = new Transaction();

  tx.moveCall({
    target: `${CONTRACT_ADDRESS}::quiz::view_solution_simple`,
    arguments: [
      tx.object(payment), // 用户的代币ID
      tx.pure.u64(amount), // 要销毁的积分数量
    ],
  });

  return tx;
}

/**
 * 创建直接奖励交易参数
 * @param quizManagerId - Quiz管理器ID
 * @param userAddress - 用户地址
 * @param amount - 奖励数量
 * @returns 签名执行交易参数
 */
export function createDirectRewardParams(
  quizManagerId: string,
  userAddress: string,
  amount: number
): { transaction: Transaction } {
  return {
    transaction: createDirectRewardTransaction(
      quizManagerId,
      userAddress,
      amount
    ),
  };
}

// /**
//  * 创建交易对象用于添加问题到链上
//  * @param quizManagerId - Quiz管理器ID
//  * @param content - 问题内容
//  * @param correctAnswer - 正确答案
//  * @param rewardPoints - 回答正确的积分奖励
//  * @param solutionContent - 解析内容
//  * @param tokenCost - 查看解析所需积分
//  * @returns 交易对象
//  */
export function createAddQuestionTransaction(
  quizManagerId: string,
  content: string,
  correctAnswer: string,
  rewardPoints: number,
  solutionContent: string,
  tokenCost: number
): Transaction {
  const tx = new Transaction();

  tx.moveCall({
    target: `${CONTRACT_ADDRESS}::point_token::add_question`,
    arguments: [
      tx.object(quizManagerId), // Quiz管理器
      tx.pure.string(content), // 问题内容
      tx.pure.string(correctAnswer), // 正确答案
      tx.pure.u64(rewardPoints), // 奖励积分
      tx.pure.string(solutionContent), // 解析内容
      tx.pure.u64(tokenCost), // 解析费用
    ],
  });

  return tx;
}

/**
 * 创建交易对象用于添加简化问题到链上（不包含答案、解析和选项）
 * 由于TypeScript中处理Move vector参数有困难，简化为创建一个不包含选项的问题
 * @param registryId - 问题注册表ID
 * @param content - 问题内容
 * @returns 交易对象
 */
export function createAddSimpleQuestionTransaction(
  registryId: string,
  content: string
): Transaction {
  const tx = new Transaction();

  // 假设我们添加了一个新的合约方法，只接收content参数
  tx.moveCall({
    target: `${CONTRACT_ADDRESS}::quiz::add_simple_question`,
    arguments: [
      tx.object(registryId), // 问题注册表
      tx.pure.string(content), // 问题内容
    ],
  });

  return tx;
}

/**
 * 创建交易参数用于添加简化问题
 * @param registryId - 问题注册表ID
 * @param content - 问题内容
 * @returns 签名执行交易参数
 */
export function createAddSimpleQuestionParams(
  registryId: string,
  content: string
): { transaction: Transaction } {
  return {
    transaction: createAddSimpleQuestionTransaction(
      registryId,
      content
    ),
  };
}

export default {
  createRewardTransaction,
  createDirectRewardTransaction,
  createViewSolutionSimpleTransaction,
  createDirectRewardParams,
  createAddQuestionTransaction,
  createAddSimpleQuestionTransaction,
  createAddSimpleQuestionParams,
  CONTRACT_ADDRESS,
};
