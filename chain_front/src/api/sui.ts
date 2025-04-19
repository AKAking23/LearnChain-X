import { Transaction } from '@mysten/sui/transactions';
import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';

// 根据环境配置Sui客户端
const client = new SuiClient({ url: getFullnodeUrl('testnet') }); // 根据实际环境修改为'devnet'/'testnet'/'mainnet'

// 合约地址
const CONTRACT_ADDRESS = '0x20cded4f9df05e37b44e3be2ffa9004dec77786950719fad6083694fdca45bf2'; // 需要替换为实际部署的合约地址

/**
 * 回答正确后奖励积分
 * @param signAndExecuteTransactionBlock - 钱包签名方法
 * @param userAddress - 用户地址
 * @param questionId - 问题ID
 * @param points - 奖励积分数量
 * @returns 交易结果
 */
export async function rewardCorrectAnswer(
  signAndExecuteTransactionBlock: (options: { transactionBlock: any }) => Promise<any>,
  quizManagerId: string,
  userAddress: string,
  questionId: number,
  points: number
) {
  try {
    const tx = new Transaction();
    
    tx.moveCall({
      target: `${CONTRACT_ADDRESS}::point_token::reward_correct_answer`,
      arguments: [
        tx.object(quizManagerId), // Quiz管理器实例
        tx.pure(userAddress),     // 用户地址
        tx.pure(questionId),      // 问题ID
        tx.pure(points)           // 奖励的积分数量
      ]
    });

    return await signAndExecuteTransactionBlock({ transactionBlock: tx });
  } catch (error) {
    console.error('奖励积分失败:', error);
    throw error;
  }
}

/**
 * 查看题目解析（消耗积分）
 * @param signAndExecuteTransactionBlock - 钱包签名方法
 * @param solutionId - 解析内容对象ID
 * @param coinId - 用户支付的代币ID
 * @returns 交易结果
 */
export async function viewSolution(
  signAndExecuteTransactionBlock: (options: { transactionBlock: any }) => Promise<any>,
  solutionId: string,
  coinId: string
) {
  try {
    const tx = new Transaction();
    
    tx.moveCall({
      target: `${CONTRACT_ADDRESS}::point_token::view_solution`,
      arguments: [
        tx.object(solutionId), // 解析内容对象
        tx.object(coinId)      // 用于支付的代币
      ]
    });

    return await signAndExecuteTransactionBlock({ transactionBlock: tx });
  } catch (error) {
    console.error('查看解析失败:', error);
    throw error;
  }
}

export default {
  rewardCorrectAnswer,
  viewSolution
}; 