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
 * 创建交易对象用于查看题目解析（消耗积分）
 * @param solutionId - 解析内容对象ID
 * @param coinId - 用户支付的代币ID
 * @returns 交易对象
 */
export function createViewSolutionTransaction(
  solutionId: string,
  coinId: string
): Transaction {
  const tx = new Transaction();

  tx.moveCall({
    target: `${CONTRACT_ADDRESS}::point_token::view_solution`,
    arguments: [
      tx.object(solutionId), // 解析内容对象
      tx.object(coinId), // 用于支付的代币
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

export default {
  createRewardTransaction,
  createDirectRewardTransaction,
  createViewSolutionTransaction,
  createDirectRewardParams,
  CONTRACT_ADDRESS,
};
