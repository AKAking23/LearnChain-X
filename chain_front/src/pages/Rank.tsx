import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  useCurrentAccount,
  useSuiClient,
  useSignAndExecuteTransaction,
  useSignPersonalMessage,
} from "@mysten/dapp-kit";
import { SealClient, getAllowlistedKeyServers, SessionKey } from "@mysten/seal";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import "../styles/Rank.css";
import { createQueryBlobsTransaction } from "@/api/walrus";
import { TESTNET_COUNTER_PACKAGE_ID } from "@/utils/constants";
import { Transaction } from "@mysten/sui/transactions";

interface QuizQuestion {
  id?: number;
  question: string;
  options: string[];
  explanation?: string;
}

interface EncryptedQuizData {
  questions: QuizQuestion[];
  difficulty: string;
  timestamp: number;
  creator: string;
}

const Rank: React.FC = () => {
  const [searchParams] = useSearchParams();
  const difficulty = searchParams.get("difficulty") || "primary";
  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const { mutate: signPersonalMessage } = useSignPersonalMessage();

  const [loading, setLoading] = useState<boolean>(true);
  const [decrypting, setDecrypting] = useState<boolean>(false);
  const [quizData, setQuizData] = useState<EncryptedQuizData | null>(null);
  const [walrusBlobId, setWalrusBlobId] = useState<string>("");
  const [suiWalrusUrl, setSuiWalrusUrl] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // 创建Seal客户端，使用类型断言处理版本兼容性问题
  // @ts-ignore - 忽略SuiClient版本兼容性问题
  const sealClient = new SealClient({
    suiClient,
    serverObjectIds: getAllowlistedKeyServers("testnet"),
    verifyKeyServers: false,
  });

  //   // 从链上查询指定难度的题目Blob列表
  const fetchQuizBlobsByDifficulty = async () => {
    //     if (!currentAccount) return;
    //     setError(null);
    //     setLoading(true);
    //     try {
    //       // 创建查询交易
    //       const tx = createQueryBlobsTransaction(
    //         difficulty,
    //         TESTNET_COUNTER_PACKAGE_ID
    //       );
    //       console.log(tx);
    //       // 使用signAndExecuteTransaction钩子代替直接调用suiClient
    //       signAndExecuteTransaction(
    //         { transaction: tx as any }, // 使用类型断言解决类型兼容性问题
    //         {
    //           onSuccess: (result) => {
    //             console.log("查询交易执行成功:", result);
    //             // 从交易结果中提取事件
    //             // @ts-expect-error - 处理返回值结构不兼容问题
    //             const events = result.events || [];
    //             // 查找BlobPublished事件
    //             const blobEvents = events.filter(
    //               (event: any) =>
    //                 event.type?.includes("BlobPublished") &&
    //                 event.parsedJson?.difficulty === difficulty
    //             );
    //             if (blobEvents.length > 0) {
    //               // 获取最近的一个事件
    //               const latestEvent = blobEvents[blobEvents.length - 1];
    //               const blobId = latestEvent.parsedJson?.blob_id;
    //               const eventTx = latestEvent.id?.txDigest;
    //               if (blobId) {
    //                 // 存储到localStorage
    //                 const encryptedKey = `encrypted_${difficulty}_${currentAccount.address}`;
    //                 localStorage.setItem(encryptedKey, blobId);
    //                 // 构建Sui对象URL
    //                 const suiUrl = `https://suiscan.xyz/testnet/object/${eventTx}`;
    //                 const encryptedSuiUrl = `encryptedSuiUrl_${difficulty}_${currentAccount.address}`;
    //                 localStorage.setItem(encryptedSuiUrl, suiUrl);
    //                 // 更新状态
    //                 setWalrusBlobId(blobId);
    //                 setSuiWalrusUrl(suiUrl);
    //                 setError(null);
    //               } else {
    //                 setError("无法从事件中提取blobId");
    //               }
    //             } else {
    //               setError(`未找到${difficulty}难度的题目数据，请确认已完成答题`);
    //             }
    //             setLoading(false);
    //           },
    //           onError: (error) => {
    //             console.error("查询题目Blob失败:", error);
    //             setError(
    //               `查询链上数据失败: ${
    //                 error instanceof Error ? error.message : String(error)
    //               }`
    //             );
    //             setLoading(false);
    //           },
    //         }
    //       );
    //     } catch (err) {
    //       console.error("创建查询交易失败:", err);
    //       setError(
    //         `创建查询交易失败: ${err instanceof Error ? err.message : String(err)}`
    //       );
    //       setLoading(false);
    //     }
  };

  useEffect(() => {
    // 从localStorage获取已存储的加密题目信息
    const fetchEncryptedQuizInfo = async () => {
      setLoading(false);
      setTimeout(async () => {
        const aggregators = [
          "aggregator1",
          "aggregator2",
          "aggregator3",
          "aggregator4",
          "aggregator5",
          "aggregator6",
        ];
        const encryptedKey = `encrypted_${difficulty}_${currentAccount?.address}`;
        console.log(encryptedKey, "encryptedKey--");

        const storedBlobId = localStorage.getItem(encryptedKey);
        if (!storedBlobId) return;
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 10000);
          const randomAggregator =
            aggregators[Math.floor(Math.random() * aggregators.length)];
          const aggregatorUrl = `/${randomAggregator}/v1/blobs/${storedBlobId}`;
          const response = await fetch(aggregatorUrl, {
            signal: controller.signal,
          });
          clearTimeout(timeout);
          if (!response.ok) {
            return null;
          }
          const encryptedData = await response.arrayBuffer();

          // 生成交易字节
          const tx = new Transaction();
          const txBytes = await tx.build({
            client: suiClient,
            onlyTransactionKind: true,
          });

          // 获取个人消息签名
          // 创建带有签名的会话密钥
          const sessionKey = new SessionKey({
            address: currentAccount?.address,
            packageId: TESTNET_COUNTER_PACKAGE_ID,
            ttlMin: 10,
          });
          const signatureResult = await new Promise((resolve) => {
            signPersonalMessage(
              {
                message: sessionKey.getPersonalMessage(),
              },
              {
                onSuccess: (result) => {
                  console.log("签名成功:", result);
                  resolve(result);
                },
                onError: (error) => {
                  console.error("签名失败:", error);
                  resolve(null);
                },
              }
            );
          });

          // 如果获取签名失败，则返回
          if (!signatureResult) {
            console.error("无法获取个人消息签名");
            return null;
          }

          // 解密数据
          try {
            const decryptedResult = await sealClient.decrypt({
              data: new Uint8Array(encryptedData),
              sessionKey,
              txBytes,
            });

            // 转换为文本并解析
            const textDecoder = new TextDecoder();
            const jsonString = textDecoder.decode(
              decryptedResult.data || decryptedResult
            );
            console.log(jsonString, "jsonString---");

            // 尝试解析JSON
            try {
              const jsonData = JSON.parse(jsonString);
              console.log(jsonData, "成功解析JSON数据");
              // 设置解密后的数据
              setQuizData(jsonData);
            } catch (jsonError) {
              console.error(
                "JSON解析失败:",
                jsonError,
                "原始字符串:",
                jsonString
              );
            }
          } catch (decryptError) {
            console.error("解密失败:", decryptError);
          }
        } catch (err) {
          console.error(
            `Blob ${storedBlobId} cannot be retrieved from Walrus`,
            err
          );
          return null;
        }
      }, 1500);
    };

    fetchEncryptedQuizInfo();
  }, [currentAccount, difficulty]);

  // 从Walrus下载并解密题目数据
  const downloadAndDecryptQuiz = async () => {
    if (!walrusBlobId || !currentAccount) return;

    setDecrypting(true);
    setError(null);

    try {
      // 构建Walrus数据URL
      const walrusUrl = `https://walrus.space/v1/blobs/${walrusBlobId}`;

      // 获取加密数据
      const response = await fetch(walrusUrl);
      if (!response.ok) {
        throw new Error(`获取加密数据失败: ${response.statusText}`);
      }

      // 获取加密数据的二进制内容
      const encryptedData = await response.arrayBuffer();

      // 生成交易字节
      const tx = new Transaction();
      const txBytes = await tx.build({
        client: suiClient,
        onlyTransactionKind: true,
      });

      // 获取个人消息签名
      const personalMessage = `Decrypt quiz data for ${difficulty} level`;
      const signatureResult = await new Promise((resolve) => {
        signPersonalMessage(
          {
            message: new TextEncoder().encode(personalMessage),
          },
          {
            onSuccess: (result) => {
              console.log("签名成功:", result);
              resolve(result);
            },
            onError: (error) => {
              console.error("签名失败:", error);
              resolve(null);
            },
          }
        );
      });

      // 如果获取签名失败，则返回
      if (!signatureResult) {
        throw new Error("无法获取个人消息签名");
      }

    //   try {
    //     // 创建带有签名的会话密钥
    //     const sessionKey = new SessionKey({
    //       address: currentAccount.address,
    //       packageId: TESTNET_COUNTER_PACKAGE_ID,
    //       ttlMin: 10,
    //       personalMessageSignature: signatureResult.signature,
    //     });

    //     // 使用SealClient解密数据
    //     const decryptedResult = await sealClient.decrypt({
    //       data: new Uint8Array(encryptedData),
    //       sessionKey,
    //       txBytes,
    //     });

    //     if (!decryptedResult) {
    //       throw new Error("解密失败");
    //     }

    //     // 将解密后的二进制数据转换为文本
    //     const textDecoder = new TextDecoder();
    //     const jsonString = textDecoder.decode(
    //       decryptedResult.data || decryptedResult
    //     );

    //     // 解析JSON数据
    //     const parsedData = JSON.parse(jsonString) as EncryptedQuizData;
    //     setQuizData(parsedData);

    //     console.log("成功解密题目数据:", parsedData);
    //   } catch (decryptError) {
    //     console.error("解密数据失败:", decryptError);
    //     setError(
    //       `解密数据失败: ${
    //         decryptError instanceof Error
    //           ? decryptError.message
    //           : String(decryptError)
    //       }`
    //     );
    //   }
    } catch (err) {
    //   console.error("下载或解密题目数据失败:", err);
    //   setError(
    //     `下载或解密题目数据失败: ${
    //       err instanceof Error ? err.message : String(err)
    //     }`
    //   );
    } finally {
    //   setDecrypting(false);
    }
  };

  if (loading) {
    return (
      <div className="rank-loading">
        <Loader2 className="animate-spin" />
        <h2>正在获取{difficulty}难度加密题目信息...</h2>
      </div>
    );
  }

  return (
    <div className="rank-container">
      <h1 className="rank-title">{difficulty}难度题目排行榜</h1>

      {error && <div className="rank-error">{error}</div>}

      <Button
        onClick={fetchQuizBlobsByDifficulty}
        disabled={loading}
        className="retry-button"
        style={{ marginBottom: "10px", backgroundColor: "#000", color: "#fff" }}
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin mr-2" />
            查询中...
          </>
        ) : (
          "重新查询链上数据"
        )}
      </Button>

      {walrusBlobId && (
        <div className="encrypted-info">
          <h2>已找到加密题目信息</h2>
          <p>BlobId: {walrusBlobId}</p>
          <p>难度级别: {difficulty}</p>

          {suiWalrusUrl && (
            <a
              href={suiWalrusUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="sui-link"
            >
              查看Sui对象
            </a>
          )}

          <Button
            onClick={downloadAndDecryptQuiz}
            disabled={decrypting}
            className="decrypt-button"
          >
            {decrypting ? (
              <>
                <Loader2 className="animate-spin mr-2" />
                解密中...
              </>
            ) : (
              "下载并解密题目数据"
            )}
          </Button>
        </div>
      )}

      {quizData && (
        <div className="quiz-data">
          <h2>成功解密题目数据</h2>
          <p>创建者: {quizData.creator}</p>
          <p>题目难度: {quizData.difficulty}</p>
          <p>创建时间: {new Date(quizData.timestamp).toLocaleString()}</p>
          <p>题目数量: {quizData.questions.length}</p>

          <div className="questions-list">
            <h3>题目列表</h3>
            {quizData.questions.map((question, index) => (
              <div key={index} className="question-item">
                <h4>
                  题目 {index + 1}: {question.question}
                </h4>
                <ul className="options-list">
                  {question.options.map((option, optIndex) => (
                    <li key={optIndex}>{option}</li>
                  ))}
                </ul>
                {question.explanation && (
                  <p className="explanation">解析: {question.explanation}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Rank;
