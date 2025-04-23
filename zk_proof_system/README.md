
1. 安装依赖
首先需要安装项目所需的依赖。项目分为三个部分：合约、前端和零知识证明系统，每个部分都需要分别安装依赖。
# 安装前端依赖
cd chain_front
pnpm install

# 安装ZK证明系统依赖
cd ../zk_proof_system
npm install circomlib snarkjs

2. 编译电路
需要先编译零知识证明电路，生成验证密钥和证明密钥：
cd zk_proof_system/circuit
mkdir build

# 编译电路
circom ability.circom --r1cs --wasm -o build

# 生成密钥
cd build
snarkjs powersoftau new bn128 12 pot12_0000.ptau -v
snarkjs powersoftau contribute pot12_0000.ptau pot12_0001.ptau --name="First contribution" -v
snarkjs powersoftau prepare phase2 pot12_0001.ptau pot12_final.ptau -v
snarkjs groth16 setup ../ability.r1cs pot12_final.ptau ability_proof.zkey
snarkjs zkey export verificationkey ability_proof.zkey verification_key.json

# 拷贝生成的文件到前端可访问的位置
mkdir -p ../../chain_front/public/circuits
cp ability_proof.wasm ability_proof.zkey verification_key.json ../../chain_front/public/circuits/


3. 编译和部署合约
使用Sui CLI部署合约：
cd chain_contract

# 编译合约
sui move build

# 部署合约到测试网
sui client publish --gas-budget 10000000

4. 配置前端
在前端中配置合约地址：
cd chain_front

# 创建环境配置文件
echo "VITE_CONTRACT_PACKAGE_ID=你的Package_ID" > .env

另外，需要在chain_front/src/pages/ZkProof.tsx中更新引用路径，确保正确引入生成的零知识证明工具：
// 修改引用路径，按照实际项目结构调整
import { generateAbilityProof } from '../utils/zkProof';
同时需要在前端创建一个工具文件将之前写的函数移入：

# 创建工具目录
mkdir -p chain_front/src/utils

# 将ZK证明功能移入前端工具中
cp zk_proof_system/js/src/generate_proof.js chain_front/src/utils/zkProof.js