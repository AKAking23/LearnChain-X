// #[test_only]
// module chain_contract::sbt_tests {
//     use sui::test_scenario::{Self as ts, Scenario};
//     use sui::test_utils::{assert_eq};
//     use std::string::{Self, String};
//     use chain_contract::sbt::{Self, SoulboundToken, IssuerCap, SBT};

//     // 测试地址
//     const ADMIN: address = @0xA11CE;
//     const USER: address = @0xB0B;

//     // 测试数据
//     const NAME: vector<u8> = b"测试SBT";
//     const DESCRIPTION: vector<u8> = b"这是一个用于测试的SBT";
//     const URL: vector<u8> = b"https://example.com/test_sbt.png";

//     // 辅助函数：创建测试场景并初始化
//     fun setup_test(): Scenario {
//         // 启动以管理员身份的场景
//         let scenario = ts::begin(ADMIN);
//         {
//             // 初始化模块
//             sbt::test_init(ts::ctx(&mut scenario));
//         };
//         scenario
//     }

//     #[test]
//     fun test_mint_sbt() {
//         let scenario = setup_test();
        
//         // 第一阶段：管理员铸造SBT给用户
//         ts::next_tx(&mut scenario, ADMIN);
//         {
//             // 获取发行者凭证
//             let issuer_cap = ts::take_from_sender<IssuerCap>(&scenario);
            
//             // 铸造SBT给用户
//             sbt::mint(
//                 &issuer_cap,
//                 string::utf8(NAME),
//                 string::utf8(DESCRIPTION),
//                 string::utf8(URL),
//                 USER,
//                 ts::ctx(&mut scenario)
//             );
            
//             // 归还发行者凭证
//             ts::return_to_sender(&scenario, issuer_cap);
//         };
        
//         // 第二阶段：验证用户收到SBT
//         ts::next_tx(&mut scenario, USER);
//         {
//             // 获取用户拥有的SBT
//             let token = ts::take_from_sender<SoulboundToken>(&scenario);
            
//             // 验证SBT属性
//             assert_eq(sbt::name(&token), string::utf8(NAME));
//             assert_eq(sbt::description(&token), string::utf8(DESCRIPTION));
//             assert_eq(sbt::url(&token), string::utf8(URL));
            
//             // 归还SBT
//             ts::return_to_sender(&scenario, token);
//         };
        
//         ts::end(scenario);
//     }

//     #[test]
//     fun test_add_attribute() {
//         let scenario = setup_test();
        
//         // 第一阶段：管理员铸造SBT给用户
//         ts::next_tx(&mut scenario, ADMIN);
//         {
//             let issuer_cap = ts::take_from_sender<IssuerCap>(&scenario);
            
//             sbt::mint(
//                 &issuer_cap,
//                 string::utf8(NAME),
//                 string::utf8(DESCRIPTION),
//                 string::utf8(URL),
//                 USER,
//                 ts::ctx(&mut scenario)
//             );
            
//             ts::return_to_sender(&scenario, issuer_cap);
//         };
        
//         // 第二阶段：用户添加属性
//         ts::next_tx(&mut scenario, USER);
//         {
//             let token = ts::take_from_sender<SoulboundToken>(&scenario);
//             let attr_name = string::utf8(b"level");
//             let attr_value = string::utf8(b"1");
            
//             // 添加一个属性
//             sbt::add_attribute(
//                 &mut token,
//                 attr_name,
//                 attr_value,
//                 ts::ctx(&mut scenario)
//             );
            
//             // 验证属性已添加
//             assert_eq(sbt::has_attribute(&token, &attr_name), true);
//             assert_eq(sbt::get_attribute(&token, &attr_name), attr_value);
            
//             ts::return_to_sender(&scenario, token);
//         };
        
//         ts::end(scenario);
//     }
// } 