/**
 * 积分代币模块
 * 实现了ERC20风格的代币，用于答题系统的奖励和支付
 * 用户答对题目获得积分，查看解析需要消耗积分
 */
module chain_contract::point_token;

use std::option;
use std::string;
use sui::balance::{Self, Balance};
use sui::coin::{Self, Coin, TreasuryCap};
use sui::event;
use sui::object::{Self, UID};
use sui::package;
use sui::transfer;
use sui::tx_context::{Self, TxContext};

// 错误码定义
/// 代币余额不足错误
const EInsufficientBalance: u64 = 0;
/// 操作未被授权错误
const ENotAuthorized: u64 = 1;

/**
     * 定义积分代币类型
     * 该结构仅用于类型化代币，没有实际字段
     */
public struct POINT has drop {}

/**
     * 答题管理器结构
     * 控制积分代币的发行和管理
     */
public struct QuizManager has key {
    id: UID,
    /// 积分代币的铸币权，用于创建新代币
    treasury_cap: TreasuryCap<POINT>,
    /// 管理员地址，只有管理员可以管理代币
    admin: address,
    // 可以根据需要添加其他管理字段
}

/**
     * 答案解析结构
     * 存储特定问题的解析内容和所需的查看费用
     */
public struct SolutionContent has key, store {
    id: UID,
    /// 关联的问题ID
    question_id: u64,
    /// 解析内容
    content: string::String,
    /// 查看解析所需的代币数量
    token_cost: u64,
}

// 事件定义
/**
     * 答题完成事件
     * 当用户完成答题时触发，记录答题结果
     */
public struct QuizCompleted has copy, drop {
    /// 用户地址
    user: address,
    /// 问题ID
    question_id: u64,
    /// 是否回答正确
    is_correct: bool,
    /// 获得的积分（如果回答正确）
    points_earned: u64,
}

/**
     * 查看解析事件
     * 当用户查看题目解析时触发
     */
public struct SolutionViewed has copy, drop {
    /// 用户地址
    user: address,
    /// 问题ID
    question_id: u64,
    /// 消耗的代币数量
    tokens_spent: u64,
}

/**
     * 创建新的QuizManager实例
     * 初始化积分代币系统
     * @param ctx - 交易上下文
     * @return 创建的QuizManager实例
     */
public fun create_quiz_manager(ctx: &mut TxContext): QuizManager {
    // 创建代币元数据
    let (treasury_cap, metadata) = coin::create_currency<POINT>(
        POINT {},
        9, // 小数位数
        b"POINT", // 符号
        b"Quiz Points", // 名称
        b"Points earned from answering questions correctly", // 描述
        option::none(), // 图标URL
        ctx,
    );

    // 转移元数据给发布者
    transfer::public_transfer(metadata, tx_context::sender(ctx));

    // 创建并返回Quiz管理器
    QuizManager {
        id: object::new(ctx),
        treasury_cap,
        admin: tx_context::sender(ctx),
    }
}

/**
     * 部署合约并初始化Quiz系统
     * 创建管理器实例并转移给交易发起者
     * @param ctx - 交易上下文
     */
public entry fun initialize(ctx: &mut TxContext) {
    // 创建管理器实例
    let quiz_manager = create_quiz_manager(ctx);

    // 转移给交易发起者
    transfer::transfer(quiz_manager, tx_context::sender(ctx));
}

/**
     * 添加答题解析
     * 创建并共享新的解析内容对象
     * @param manager - 管理器实例
     * @param question_id - 问题ID
     * @param content - 解析内容
     * @param token_cost - 查看所需代币数量
     * @param ctx - 交易上下文
     */
public entry fun add_solution(
    manager: &mut QuizManager,
    question_id: u64,
    content: string::String,
    token_cost: u64,
    ctx: &mut TxContext,
) {
    // 验证是否为管理员
    assert!(tx_context::sender(ctx) == manager.admin, ENotAuthorized);

    // 创建解析对象
    let solution = SolutionContent {
        id: object::new(ctx),
        question_id,
        content,
        token_cost,
    };

    // 共享解析内容对象，使其可被所有人访问
    transfer::share_object(solution);
}

/**
     * 回答正确后奖励积分
     * 铸造新的积分代币并转移给用户
     * @param manager - 管理器实例
     * @param user - 用户地址
     * @param question_id - 问题ID
     * @param points - 奖励的积分数量
     * @param ctx - 交易上下文
     */
public entry fun reward_correct_answer(
    manager: &mut QuizManager,
    user: address,
    question_id: u64,
    points: u64,
    ctx: &mut TxContext,
) {
    // 验证是否为管理员
    assert!(tx_context::sender(ctx) == manager.admin, ENotAuthorized);

    // 铸造积分
    let points_coin = coin::mint<POINT>(&mut manager.treasury_cap, points, ctx);

    // 转移给用户
    transfer::public_transfer(points_coin, user);

    // 发出事件
    event::emit(QuizCompleted {
        user,
        question_id,
        is_correct: true,
        points_earned: points,
    });
}

/**
     * 记录错误答案
     * 当用户回答错误时，仅记录事件，不扣除积分
     * @param manager - 管理器实例
     * @param user - 用户地址
     * @param question_id - 问题ID
     * @param ctx - 交易上下文
     */
public entry fun record_incorrect_answer(
    manager: &QuizManager,
    user: address,
    question_id: u64,
    ctx: &mut TxContext,
) {
    // 验证是否为管理员
    assert!(tx_context::sender(ctx) == manager.admin, ENotAuthorized);

    // 错误回答不扣积分，只记录事件
    event::emit(QuizCompleted {
        user,
        question_id,
        is_correct: false,
        points_earned: 0,
    });
}

/**
     * 查看解析（消耗积分）
     * 用户支付积分以查看问题解析
     * @param solution - 解析内容对象
     * @param payment - 用户的代币支付
     * @param ctx - 交易上下文
     */
public entry fun view_solution(
    solution: &SolutionContent,
    payment: &mut Coin<POINT>,
    ctx: &mut TxContext,
) {
    // 检查用户积分是否足够
    let required = solution.token_cost;
    assert!(coin::value(payment) >= required, EInsufficientBalance);

    // 从用户的代币中扣除费用
    let burn_amount = coin::split(payment, required, ctx);
    let burn_balance = coin::into_balance(burn_amount);

    // 记录事件
    event::emit(SolutionViewed {
        user: tx_context::sender(ctx),
        question_id: solution.question_id,
        tokens_spent: required,
    });

    // 销毁代币
    balance::destroy_zero(burn_balance);
}

/**
     * 更改管理员
     * 修改管理器的管理员地址
     * @param manager - 管理器实例
     * @param new_admin - 新管理员地址
     * @param ctx - 交易上下文
     */
public entry fun change_admin(manager: &mut QuizManager, new_admin: address, ctx: &mut TxContext) {
    assert!(tx_context::sender(ctx) == manager.admin, ENotAuthorized);
    manager.admin = new_admin;
}

/**
     * 获取解析内容
     * @param solution - 解析内容对象
     * @return 解析内容
     */
public fun get_solution_content(solution: &SolutionContent): string::String {
    solution.content
}

/**
     * 获取解析费用
     * @param solution - 解析内容对象
     * @return 所需代币数量
     */
public fun get_solution_cost(solution: &SolutionContent): u64 {
    solution.token_cost
}
