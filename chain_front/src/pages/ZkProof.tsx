import React, { useState } from "react";
// import { useWallet } from "@suiet/wallet-kit";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
} from "@mysten/dapp-kit";
import {
  generateAbilityProof,
  getVerifierId,
  getVerificationKey,
} from "../utils/zkProof";
import {
  createVerifyZkProofParams,
  createAddVerificationKeyParams,
} from "../api/sui";
import { Loader2 } from "lucide-react";

// 样式定义
const styles = {
  container: {
    maxWidth: "800px",
    margin: "0 auto",
    padding: "2rem",
    borderRadius: "12px",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    backdropFilter: "blur(10px)",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
    color: "#fff",
    position: "relative" as const,
    zIndex: 999,
  },
  title: {
    fontSize: "2rem",
    marginBottom: "1.5rem",
    color: "#fff",
    textAlign: "center" as const,
  },
  section: {
    marginBottom: "2rem",
  },
  sectionTitle: {
    fontSize: "1.5rem",
    marginBottom: "1rem",
    color: "#f0f0f0",
  },
  description: {
    lineHeight: "1.6",
    marginBottom: "1.5rem",
    color: "#ddd",
  },
  inputGroup: {
    marginBottom: "1rem",
  },
  label: {
    display: "block",
    marginBottom: "0.5rem",
    color: "#eee",
  },
  select: {
    padding: "0.75rem",
    borderRadius: "8px",
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    color: "#fff",
    marginBottom: "1rem",
  },
  button: {
    padding: "0.75rem 1.5rem",
    borderRadius: "8px",
    backgroundColor: "#3b82f6",
    color: "#fff",
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
    transition: "background-color 0.2s",
  },
  verifyButton: {
    backgroundColor: "#10b981",
  },
  card: {
    padding: "1.5rem",
    borderRadius: "8px",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    marginBottom: "1.5rem",
  },
  infoText: {
    color: "#bbb",
    fontSize: "0.9rem",
    marginBottom: "0.5rem",
  },
  proofContainer: {
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    padding: "1rem",
    borderRadius: "6px",
    overflowX: "auto" as const,
    maxHeight: "200px",
    fontSize: "0.8rem",
  },
  statusSuccess: {
    color: "#10b981",
    fontWeight: "bold",
  },
  statusPending: {
    color: "#f59e0b",
    fontWeight: "bold",
  },
};

const ZkProof: React.FC = () => {
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const [userSbtLevel, setUserSbtLevel] = useState<number>(1); // 默认为中级
  const [requiredLevel, setRequiredLevel] = useState<number>(1);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isAddingKey, setIsAddingKey] = useState<boolean>(false);
  const [proof, setProof] = useState<string>("");
  const [publicInputs, setPublicInputs] = useState<string>("");
  const [verificationResult, setVerificationResult] = useState<boolean | null>(
    null
  );
  const [showAdminPanel, setShowAdminPanel] = useState<boolean>(false);

  // 模拟的SBT ID (在实际应用中应从链上查询用户的SBT)
  const mockSbtId = BigInt("123456789");

  // 模拟从验证者获取挑战值
  const getChallenge = () => {
    return BigInt(Math.floor(Math.random() * 1000000000));
  };

  const handleGenerateProof = async () => {
    if (!currentAccount) {
      alert(`请先连接钱包！`);
      return;
    }

    setIsGenerating(true);
    try {
      const challenge = getChallenge();
      const result = await generateAbilityProof(
        userSbtLevel,
        mockSbtId,
        requiredLevel,
        challenge
      );
      console.log(result, "result---");
      setProof(result.proof);
      setPublicInputs(result.publicInputs);
      alert(`零知识证明生成成功！`);
    } catch (error) {
      console.error("生成证明失败:", error);
      alert("生成证明失败: " + (error as Error).message);
    } finally {
      setIsGenerating(false);
    }
    console.log(isGenerating, "isGenerating---");
  };

  const handleVerifyProof = async () => {
    if (!proof || !publicInputs || !currentAccount) {
      alert(`请先生成证明或连接钱包！`);
      return;
    }

    setIsVerifying(true);

    try {
      // 获取验证器对象ID
      const verifierId = await getVerifierId();
      // const circuitName = "ability" + new Date(); // 电路名称  后续可改为企业/社区名称
      const circuitName = "ability"; // 电路名称  后续可改为企业/社区名称

      // 创建并执行交易
      const txParams = createVerifyZkProofParams(
        verifierId,
        circuitName,
        proof,
        publicInputs,
        requiredLevel
      );

      signAndExecute(txParams, {
        onSuccess: (result) => {
          console.log("交易成功:", result);
          setVerificationResult(true);
          alert("证明验证成功！");
          setIsVerifying(false);
        },
        onError: (error) => {
          console.error("交易失败:", error);
          setVerificationResult(false);
          alert("证明验证失败: " + error.message);
          setIsVerifying(false);
        },
      });
    } catch (error) {
      console.error("验证证明失败:", error);
      alert("验证证明失败: " + (error as Error).message);
      setVerificationResult(false);
      setIsVerifying(false);
    }
  };

  // 处理添加验证密钥
  const handleAddVerificationKey = async () => {
    if (!currentAccount) {
      alert(`请先连接钱包！`);
      return;
    }

    setIsAddingKey(true);

    try {
      // 获取验证器ID
      const verifierId = await getVerifierId();
      const circuitName = "ability" + new Date().getTime(); // 电路名称

      // 获取验证密钥
      const verificationKey = await getVerificationKey();

      // 创建添加验证密钥的交易
      const txParams = createAddVerificationKeyParams(
        verifierId,
        circuitName,
        verificationKey
      );

      // 执行交易
      signAndExecute(txParams, {
        onSuccess: (result) => {
          console.log("添加验证密钥成功:", result);
          alert("添加验证密钥成功！");
          setIsAddingKey(false);
        },
        onError: (error) => {
          console.error("添加验证密钥失败:", error);
          alert("添加验证密钥失败: " + error.message);
          setIsAddingKey(false);
        },
      });
    } catch (error) {
      console.error("添加验证密钥失败:", error);
      alert("添加验证密钥失败: " + (error as Error).message);
      setIsAddingKey(false);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>企业、社区认证</h1>

      {/* 管理员面板切换按钮 */}
      <div style={{ textAlign: "right", marginBottom: "1rem" }}>
        <button
          style={{
            ...styles.button,
            backgroundColor: "#6b7280",
            padding: "0.5rem 1rem",
          }}
          onClick={() => setShowAdminPanel(!showAdminPanel)}
        >
          {showAdminPanel ? "隐藏管理员面板" : "显示管理员面板"}
        </button>
        {/* <button
          style={styles.button}
          onClick={handleAddVerificationKey}
          disabled={isAddingKey}
        >
          {isAddingKey ? <Loader2 className="animate-spin" /> : "添加验证密钥"}
        </button> */}
      </div>

      {/* 管理员面板 */}
      {showAdminPanel && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>管理员面板</h2>
          <div style={styles.card}>
            <p style={styles.description}>
              添加验证密钥是验证零知识证明的必要步骤。只有验证器的管理员才能执行此操作。
            </p>
            <button
              style={styles.button}
              onClick={handleAddVerificationKey}
              disabled={isAddingKey}
            >
              {isAddingKey ? (
                <Loader2 className="animate-spin" />
              ) : (
                "添加验证密钥"
              )}
            </button>
          </div>
        </div>
      )}
      <div style={styles.section}>
        {/* <h2 style={styles.sectionTitle}>什么是零知识证明？</h2> */}
        <p style={styles.description}>
          向企业证明你拥有特定等级的能力凭证，而不必透露你的实际SBT内容或精确分数。
        </p>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>能力证明</h2>
        <p style={styles.description}>
          选择你的实际SBT等级和你想要证明的能力等级，然后生成零知识证明。
        </p>

        <div style={styles.card}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>
              你的SBT等级（实际值，仅你自己可见）
            </label>
            <select
              style={styles.select}
              value={userSbtLevel}
              onChange={(e) => setUserSbtLevel(Number(e.target.value))}
            >
              <option value={1}>初级 SBT</option>
              <option value={2}>中级 SBT</option>
              <option value={3}>高级 SBT</option>
            </select>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>需要证明的能力等级（将公开）</label>
            <select
              style={styles.select}
              value={requiredLevel}
              onChange={(e) => setRequiredLevel(Number(e.target.value))}
            >
              <option value={1}>初级</option>
              <option value={2}>中级</option>
              <option value={3}>高级</option>
            </select>
          </div>

          <button
            style={styles.button}
            onClick={handleGenerateProof}
            disabled={isGenerating || !currentAccount}
          >
            {isGenerating ? <Loader2 className="animate-spin" /> : "生成证明"}
          </button>
        </div>
      </div>

      {proof && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>验证证明</h2>
          <div style={styles.card}>
            <p style={styles.infoText}>生成的证明（简化显示）:</p>
            <div style={styles.proofContainer}>
              {proof.substring(0, 100)}...
            </div>

            <p style={styles.infoText}>公共输入:</p>
            <div style={styles.proofContainer}>{publicInputs}</div>

            <p style={styles.infoText}>
              验证状态:{" "}
              {verificationResult === null ? (
                <span style={styles.statusPending}>等待验证</span>
              ) : verificationResult ? (
                <span style={styles.statusSuccess}>验证成功</span>
              ) : (
                <span style={{ color: "red" }}>验证失败</span>
              )}
            </p>

            <button
              style={{ ...styles.button, ...styles.verifyButton }}
              onClick={handleVerifyProof}
              disabled={isVerifying}
            >
              {isVerifying ? <Loader2 className="animate-spin" /> : "验证证明"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ZkProof;
