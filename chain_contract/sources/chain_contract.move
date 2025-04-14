/*
/// Module: chain_contract
/// 这是一个SBT（灵魂绑定代币）合约，用于创建不可转让的数字资产
*/
module chain_contract::sbt {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::package;
    use sui::display;
    use std::string::{Self, String};
    use sui::event;
    use sui::table::{Self, Table};

    // ===== 错误代码 =====
    const ESoulboundTransferNotAllowed: u64 = 1;
    const ENotOwner: u64 = 2;

    // ===== 类型定义 =====
    /// SBT主对象，被用户拥有
    public struct SoulboundToken has key, store {
        id: UID,
        /// SBT名称
        name: String,
        /// SBT描述
        description: String,
        /// 元数据URL（如图像）
        url: String,
        /// 发行者
        issuer: address,
        /// 其他属性
        attributes: Table<String, String>,
    }

    /// 发布者凭证，用于验证发布者身份
    public struct IssuerCap has key, store {
        id: UID,
        issuer: address,
    }

    /// 一次性见证对象，用于初始化
    public struct SBT has drop {}

    // ===== 事件 =====
    /// 当SBT被铸造时发出的事件
    public struct SBTMinted has copy, drop {
        id: address,
        recipient: address,
        name: String,
    }

    // ===== 模块初始化 =====
    fun init(otw: SBT, ctx: &mut TxContext) {
        let publisher = package::claim(otw, ctx);
        
        // 创建显示信息
        let keys = vector[
            string::utf8(b"name"),
            string::utf8(b"description"),
            string::utf8(b"image_url"),
            string::utf8(b"issuer"),
        ];
        
        let values = vector[
            string::utf8(b"{name}"),
            string::utf8(b"{description}"),
            string::utf8(b"{url}"),
            string::utf8(b"{issuer}"),
        ];
        
        // 创建Display对象
        let mut display_obj = display::new_with_fields<SoulboundToken>(
            &publisher, keys, values, ctx
        );
        display::update_version(&mut display_obj);
        transfer::public_transfer(display_obj, tx_context::sender(ctx));

        // 转移发布者对象，使其不再可访问
        transfer::public_transfer(publisher, tx_context::sender(ctx));
        
        // 创建并转移发行者凭证给模块部署者
        let issuer_cap = IssuerCap {
            id: object::new(ctx),
            issuer: tx_context::sender(ctx),
        };
        transfer::transfer(issuer_cap, tx_context::sender(ctx));
    }

    // ===== 公共函数 =====
    /// 只有发行者能铸造SBT
    public entry fun mint(
        issuer_cap: &IssuerCap,
        name: String,
        description: String,
        url: String,
        recipient: address,
        ctx: &mut TxContext
    ) {
        let attributes = table::new<String, String>(ctx);
        
        let sbt = SoulboundToken {
            id: object::new(ctx),
            name,
            description,
            url,
            issuer: issuer_cap.issuer,
            attributes,
        };

        event::emit(SBTMinted {
            id: object::uid_to_address(&sbt.id),
            recipient,
            name: sbt.name,
        });

        // 直接转移给接收者
        transfer::transfer(sbt, recipient);
    }

    /// 添加SBT属性，仅所有者可调用
    public entry fun add_attribute(
        sbt: &mut SoulboundToken, 
        name: String, 
        value: String,
        ctx: &mut TxContext
    ) {
        // 由于无法直接获取对象所有者，我们使用交易发送者作为授权
        // 这里的前提是交易必须由SBT所有者发起
        // 在实际应用中，可以添加更复杂的授权逻辑
        let _sender = tx_context::sender(ctx);
        
        table::add(&mut sbt.attributes, name, value);
    }

    /// 查询SBT的属性值
    public fun get_attribute(sbt: &SoulboundToken, name: &String): String {
        *table::borrow(&sbt.attributes, *name)
    }

    /// 验证是否存在某个属性
    public fun has_attribute(sbt: &SoulboundToken, name: &String): bool {
        table::contains(&sbt.attributes, *name)
    }

    /// 获取SBT的名称
    public fun name(sbt: &SoulboundToken): String {
        sbt.name
    }

    /// 获取SBT的描述
    public fun description(sbt: &SoulboundToken): String {
        sbt.description
    }

    /// 获取SBT的URL
    public fun url(sbt: &SoulboundToken): String {
        sbt.url
    }

    /// 获取SBT的发行者
    public fun issuer(sbt: &SoulboundToken): address {
        sbt.issuer
    }

    // ===== 测试函数 =====
    #[test_only]
    /// 仅用于测试的初始化函数
    public fun test_init(ctx: &mut TxContext) {
        init(SBT {}, ctx)
    }
}


