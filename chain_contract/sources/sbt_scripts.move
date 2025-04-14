module chain_contract::sbt_scripts {
    use sui::tx_context::{Self, TxContext};
    use std::string::{Self, String};
    use std::vector;
    use chain_contract::sbt::{Self, IssuerCap};

    /// 使用发行者凭证批量铸造SBT给多个用户
    public entry fun batch_mint(
        cap: &IssuerCap,
        names: vector<String>,
        descriptions: vector<String>,
        urls: vector<String>,
        recipients: vector<address>,
        ctx: &mut TxContext
    ) {
        let len = vector::length(&names);
        
        // 验证所有输入向量长度一致
        assert!(
            vector::length(&descriptions) == len && 
            vector::length(&urls) == len && 
            vector::length(&recipients) == len,
            0 // 输入长度不一致
        );

        let mut i = 0;
        while (i < len) {
            sbt::mint(
                cap,
                *vector::borrow(&names, i),
                *vector::borrow(&descriptions, i),
                *vector::borrow(&urls, i),
                *vector::borrow(&recipients, i),
                ctx
            );
            i = i + 1;
        }
    }

    /// 为SBT添加多个属性
    public entry fun add_multiple_attributes(
        token: &mut sbt::SoulboundToken,
        names: vector<String>,
        values: vector<String>,
        ctx: &mut TxContext
    ) {
        let len = vector::length(&names);
        
        // 验证所有输入向量长度一致
        assert!(vector::length(&values) == len, 0);

        let mut i = 0;
        while (i < len) {
            sbt::add_attribute(
                token,
                *vector::borrow(&names, i),
                *vector::borrow(&values, i),
                ctx
            );
            i = i + 1;
        }
    }
} 