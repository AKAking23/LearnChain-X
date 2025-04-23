import React, { useState, useEffect } from "react";
// import { useWallet } from "@suiet/wallet-kit";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { generateAbilityProof } from "../utils/zkProof";
import Loading from "../components/Loading";

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
    position: "relative",
    zIndex: 999,
  },
  title: {
    fontSize: "2rem",
    marginBottom: "1.5rem",
    color: "#fff",
    textAlign: "center",
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
    overflowX: "auto",
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
  const [userSbtLevel, setUserSbtLevel] = useState<number>(1); // 默认为中级
  const [requiredLevel, setRequiredLevel] = useState<number>(1);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [proof, setProof] = useState<string>("");
  const [publicInputs, setPublicInputs] = useState<string>("");
  const [verificationResult, setVerificationResult] = useState<boolean | null>(
    null
  );

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
    if (!proof || !publicInputs) {
      alert(`请先生成证明！`);
      return;
    }

    setIsVerifying(true);

    try {
      // 模拟向合约发送验证请求
      // 实际上应该调用Sui链上的合约进行验证
      setTimeout(() => {
        setVerificationResult(true);
        alert("证明验证成功！");
        setIsVerifying(false);
      }, 2000);
    } catch (error) {
      console.error("验证证明失败:", error);
      alert("验证证明失败: " + (error as Error).message);
      setVerificationResult(false);
      setIsVerifying(false);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>零知识能力证明</h1>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>什么是零知识证明？</h2>
        <p style={styles.description}>
          零知识证明允许你向他人证明你满足某些条件，而不泄露任何额外信息。
          在这个应用中，你可以向企业证明你拥有特定等级的能力凭证，而不必透露你的实际SBT内容或精确分数。
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
            {isGenerating ? <Loading size={20} /> : "生成证明"}
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
              {isVerifying ? <Loading size={20} /> : "验证证明"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ZkProof;
