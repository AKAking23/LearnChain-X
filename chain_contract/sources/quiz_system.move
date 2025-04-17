/**
 * 答题系统整合模块
 * 整合链上合约各个模块的功能，提供简化的API接口
 */
module chain_contract::quiz_system;

use chain_contract::chain_contract::{Self, SystemConfig};
use chain_contract::point_token::{Self, QuizManager, POINT};
use chain_contract::quiz::{Self, QuestionRegistry, UserAnswerRecord};
use std::string::{Self, String};
use std::vector;
use sui::coin::{Self, Coin};
use sui::tx_context::{Self, TxContext};

// 错误码
/// 代币余额不足
const EInsufficientBalance: u64 = 0;
/// 未授权操作
const ENotAuthorized: u64 = 1;
/// 无效参数
const EInvalidParameter: u64 = 2;

/**
     * 初始化整个系统
     * 创建核心组件：代币系统、问题注册表和用户答题记录
     * @param ctx - 交易上下文
     */
public entry fun initialize_system(ctx: &mut TxContext) {
    // 初始化代币系统
    point_token::initialize(ctx);

    // 创建问题注册表
    quiz::create_question_registry(ctx);

    // 为当前用户创建答题记录
    quiz::create_user_record(ctx);
}

/**
     * 给新用户创建答题记录
     * @param ctx - 交易上下文
     */
public entry fun create_user_account(ctx: &mut TxContext) {
    quiz::create_user_record(ctx);
}

/**
     * 添加新题目的便捷函数
     * 结合系统配置进行参数验证，确保奖励和费用在合理范围内
     * @param config - 系统配置对象
     * @param registry - 问题注册表
     * @param content - 问题内容
     * @param options - 问题选项
     * @param correct_answer - 正确答案索引
     * @param points_reward - 回答正确的积分奖励
     * @param solution_cost - 查看解析所需积分
     * @param solution - 解析内容
     * @param ctx - 交易上下文
     */
public entry fun add_new_question(
    config: &SystemConfig,
    registry: &mut QuestionRegistry,
    content: String,
    options: vector<String>,
    correct_answer: u64,
    points_reward: u64,
    solution_cost: u64,
    solution: String,
    ctx: &mut TxContext,
) {
    // 只有管理员可以添加问题
    assert!(chain_contract::is_admin(config, tx_context::sender(ctx)), ENotAuthorized);

    // 获取系统参数中的最小/最大奖励值
    let min_reward_str = chain_contract::get_param(config, &string::utf8(b"min_reward"));
    let max_reward_str = chain_contract::get_param(config, &string::utf8(b"max_reward"));
    let min_solution_cost_str = chain_contract::get_param(
        config,
        &string::utf8(b"min_solution_cost"),
    );

    // 将字符串转换为整数（简化处理）
    let min_reward = string_to_u64(&min_reward_str);
    let max_reward = string_to_u64(&max_reward_str);
    let min_solution_cost = string_to_u64(&min_solution_cost_str);

    // 验证奖励和解析费用在合理范围内
    assert!(points_reward >= min_reward && points_reward <= max_reward, EInvalidParameter);
    assert!(solution_cost >= min_solution_cost, EInvalidParameter);

    // 调用quiz模块添加问题
    quiz::add_question(
        registry,
        content,
        options,
        correct_answer,
        points_reward,
        solution_cost,
        solution,
        ctx,
    );
}

/**
     * 回答问题并获得积分（如果答对）
     * @param registry - 问题注册表
     * @param manager - Quiz管理器
     * @param user_record - 用户的答题记录
     * @param question_id - 问题ID
     * @param answer - 用户提交的答案索引
     * @param ctx - 交易上下文
     */
public entry fun submit_answer(
    registry: &QuestionRegistry,
    manager: &mut QuizManager,
    user_record: &mut UserAnswerRecord,
    question_id: u64,
    answer: u64,
    ctx: &mut TxContext,
) {
    // 调用quiz模块处理答题
    quiz::answer_question(
        registry,
        manager,
        user_record,
        question_id,
        answer,
        ctx,
    );
}

/**
     * 使用代币查看解析
     * @param registry - 问题注册表
     * @param user_record - 用户的答题记录
     * @param payment - 用户的积分代币
     * @param question_id - 问题ID
     * @param ctx - 交易上下文
     */
public entry fun access_solution(
    registry: &QuestionRegistry,
    user_record: &mut UserAnswerRecord,
    payment: &mut Coin<POINT>,
    question_id: u64,
    ctx: &mut TxContext,
) {
    // 调用quiz模块处理查看解析请求
    quiz::view_solution(
        registry,
        user_record,
        payment,
        question_id,
        ctx,
    );
}

/**
     * 获取问题信息
     * 一次性获取问题的内容、选项、奖励和解析费用
     * @param registry - 问题注册表
     * @param question_id - 问题ID
     * @return 问题内容、选项列表、奖励积分和解析费用的元组
     */
public fun get_question_info(
    registry: &QuestionRegistry,
    question_id: u64,
): (String, vector<String>, u64, u64) {
    (
        quiz::get_question_content(registry, question_id),
        quiz::get_question_options(registry, question_id),
        quiz::get_question_reward(registry, question_id),
        quiz::get_solution_cost(registry, question_id),
    )
}

/**
     * 获取用户解析内容（如果已支付）
     * @param registry - 问题注册表
     * @param user_record - 用户的答题记录
     * @param question_id - 问题ID
     * @return 解析内容
     */
public fun get_solution_content(
    registry: &QuestionRegistry,
    user_record: &UserAnswerRecord,
    question_id: u64,
): String {
    quiz::get_solution(registry, user_record, question_id)
}

/**
     * 检查用户是否有权访问解析
     * @param user_record - 用户的答题记录
     * @param question_id - 问题ID
     * @return 是否可以访问解析
     */
public fun can_access_solution(user_record: &UserAnswerRecord, question_id: u64): bool {
    quiz::has_viewed_solution(user_record, question_id)
}

/**
     * 工具函数：简单的字符串转u64
     * 将字符串表示的数字转换为u64类型
     * 注意：仅支持简单数字，不支持负数或浮点数
     * @param s - 字符串
     * @return 转换后的u64数值
     */
fun string_to_u64(s: &String): u64 {
    let bytes = *string::bytes(s);
    let len = vector::length(&bytes);
    let mut i = 0;
    let mut result = 0u64;

    while (i < len) {
        let digit = (*vector::borrow(&bytes, i) as u64) - 48u64; // '0' 的ASCII码是48
        assert!(digit <= 9, EInvalidParameter); // 确保只有数字
        result = result * 10 + digit;
        i = i + 1;
    };

    result
}
