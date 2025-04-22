import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  sendMessageToCoze,
  verifyAnswer,
  getQuestionSolution,
} from "../api/coze";
import {
  createDirectRewardParams,
  createViewSolutionTransaction,
  createAddSimpleQuestionParams,
  CONTRACT_ADDRESS,
} from "../api/sui";
import "../styles/Quiz.css"; // 需要创建这个CSS文件
import { TESTNET_QUIZMANAGER_ID, TESTNET_REGISTRY_ID } from "@/utils/constants";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import { Button } from "@/components/ui/button";

interface QuizQuestion {
  id?: number;
  question: string;
  options: string[];
  explanation?: string;
}

const Quiz: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState<number>(0);
  const [quizCompleted, setQuizCompleted] = useState<boolean>(false);
  const [showAnswer, setShowAnswer] = useState<boolean>(false);
  const [answerResult, setAnswerResult] = useState<{
    isCorrect: boolean;
    correctAnswer: string | number;
    correctOptionLetter?: string;
    explanation?: string;
  } | null>(null);

  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const suiClient = useSuiClient();
  const [userCoinId, setUserCoinId] = useState<string | null>(null);
  const [userTokenBalance, setUserTokenBalance] = useState<string>("0");
  const [solutionIds] = useState<{ [key: number]: string }>({});

  // 获取用户代币ID和余额的函数
  const getUserCoinId = async (address: string) => {
    try {
      if (!address) return null;

      // 获取用户拥有的所有代币
      const coins = await suiClient.getCoins({
        owner: address,
        coinType: `${CONTRACT_ADDRESS}::point_token::POINT_TOKEN`,
      });
      console.log(coins, "coins----");

      // 如果用户有代币，返回第一个代币的ID
      if (coins && coins.data && coins.data.length > 0) {
        // 计算总余额
        let totalBalance = 0n;
        for (const coin of coins.data) {
          if (coin.balance) {
            totalBalance += BigInt(coin.balance);
          }
        }

        // 更新余额状态（转换为可读格式，假设代币有9位小数）
        const formattedBalance = formatTokenBalance(totalBalance);
        setUserTokenBalance(formattedBalance);

        return coins.data[0].coinObjectId;
      }

      return null;
    } catch (error) {
      console.error("获取用户代币失败:", error);
      return null;
    }
  };

  // 格式化代币余额的辅助函数
  const formatTokenBalance = (balance: bigint): string => {
    const decimals = 9; // 假设代币有9位小数
    const divisor = BigInt(10 ** decimals);

    if (balance === 0n) return "0";

    const integerPart = balance / divisor;
    const fractionalPart = balance % divisor;

    if (fractionalPart === 0n) {
      return integerPart.toString();
    }

    // 确保小数部分有正确的前导零
    let fractionalStr = fractionalPart.toString().padStart(decimals, "0");
    // 移除尾部的0
    fractionalStr = fractionalStr.replace(/0+$/, "");

    return `${integerPart}.${fractionalStr}`;
  };

  // 手动刷新代币余额
  const refreshTokenBalance = async () => {
    if (currentAccount) {
      await getUserCoinId(currentAccount.address);
    }
  };

  // 获取解析对象ID的函数
  const getSolutionId = async (questionId: number): Promise<string | null> => {
    try {
      // 这里应该通过链上查询获取对应问题的解析对象ID
      // 实际实现需要根据实际存储方式定制
      // 这里仅作为示例，返回缓存或默认值
      if (solutionIds[questionId]) {
        return solutionIds[questionId];
      }

      // TODO: 实现从链上获取解析对象ID的逻辑
      // 从链上获取解析对象ID
      const objects = await suiClient.getOwnedObjects({
        owner: "0x0", // 共享对象的所有者通常是0x0
        filter: {
          StructType: `${CONTRACT_ADDRESS}::point_token::SolutionContent`,
        },
        options: {
          showContent: true,
        },
      });

      // 找到匹配questionId的SolutionContent对象
      for (const obj of objects.data || []) {
        if (obj.data) {
          const content = obj.data.content;
          if (content && "fields" in content) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const fields = content.fields as Record<string, any>;
            if (fields.question_id === questionId) {
              return obj.data.objectId;
            }
          }
        }
      }

      // 如果没有找到，返回null
      return null;
    } catch (error) {
      console.error("获取解析对象ID失败:", error);
      return null;
    }
  };

  // 在组件挂载和用户账户变更时获取用户代币ID和余额
  useEffect(() => {
    if (currentAccount) {
      getUserCoinId(currentAccount.address).then((coinId) => {
        setUserCoinId(coinId);
      });
    } else {
      setUserTokenBalance("0"); // 重置余额
      setUserCoinId(null);
    }
  }, [currentAccount]);

  useEffect(() => {
    const fetchQuizQuestions = async () => {
      try {
        setLoading(true);
        // 从localStorage检查是否已经缓存了题目
        const cachedQuestions = localStorage.getItem("quizQuestions");
        // 生成或获取用户ID
        const userId =
          localStorage.getItem("userId") ||
          `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        localStorage.setItem("userId", userId);

        if (cachedQuestions) {
          setQuestions(JSON.parse(cachedQuestions));
          setLoading(false);
        } else {
          // 如果没有缓存，则调用API获取题目
          const response = await sendMessageToCoze({
            input:
              "请生成3道初级Move语言相关的选择题，每道题有4个选项，格式为JSON数组",
            userId: userId,
          });

          // 处理返回的数据
          if (response.status === "success") {
            let questions = [];

            // 尝试从不同位置提取题目数据
            if (response.data?.output && Array.isArray(response.data.output)) {
              // 标准格式
              questions = response.data.output;
            } else if (typeof response.data === "string") {
              // 如果data是字符串，尝试解析
              try {
                const parsedData = JSON.parse(response.data);
                questions = Array.isArray(parsedData)
                  ? parsedData
                  : parsedData.output && Array.isArray(parsedData.output)
                  ? parsedData.output
                  : [];
              } catch (e) {
                console.error("解析字符串数据失败", e);
              }
            }

            if (questions.length > 0) {
              setQuestions(questions);
              // 缓存到localStorage
              localStorage.setItem("quizQuestions", JSON.stringify(questions));
            } else {
              // 如果未能提取到题目数据，使用默认题目
              setQuestions(getDefaultQuestions());
            }
          } else {
            // 如果返回数据格式不正确，使用默认题目
            setQuestions(getDefaultQuestions());
          }

          // 模拟加载时间，给loading动画一些展示时间
          setTimeout(() => {
            setLoading(false);
          }, 2000);
        }
      } catch (error) {
        console.error("获取题目失败", error);
        setQuestions(getDefaultQuestions());
        setLoading(false);
      }
    };

    fetchQuizQuestions();
  }, []);

  const getDefaultQuestions = (): QuizQuestion[] => {
    return [
      {
        explanation:
          "Move语言是由Facebook的子公司Novi Financial开发的，用于其数字货币项目Diem（原Libra）的智能合约编程语言。",
        options: ["A. Google", "B. Facebook", "C. Microsoft", "D. Apple"],
        question: "Move语言是由哪个组织开发的？",
      },
      {
        explanation:
          "Move语言是一种静态类型的编程语言，它强调类型安全性和资源管理，特别适合编写智能合约。",
        options: ["A. 面向对象", "B. 静态类型", "C. 动态类型", "D. 过程式"],
        question: "Move语言的主要特点是什么？",
      },
      {
        explanation:
          "在Move语言中，使用关键字'resource'来声明资源，资源是一种特殊的结构体，它代表在Move中具有持久存在的数据。",
        options: ["A. struct", "B. resource", "C. module", "D. fun"],
        question: "在Move语言中，以下哪个关键字用于声明资源？",
      },
    ];
  };

  const handleOptionSelect = (optionIndex: number) => {
    setSelectedOption(optionIndex);
  };

  const handleNextQuestion = () => {
    // 重置答案状态
    setShowAnswer(false);
    setSelectedOption(null);
    setAnswerResult(null);

    // 移动到下一题或完成测验
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setQuizCompleted(true);
    }
  };

  const handleCheckAnswer = async () => {
    if (selectedOption === null) return;
    try {
      const userId = localStorage.getItem("userId") || "default";
      const result = await verifyAnswer({
        questionIndex: currentQuestionIndex,
        selectedOption: selectedOption,
        userId: userId,
      });

      if (result.status === "success") {
        setAnswerResult(result.data);
        setShowAnswer(true);

        // 如果答案正确，增加分数并调用合约奖励用户
        if (result.data.isCorrect && currentAccount) {
          setScore(score + 1);

          try {
            // 奖励积分数量
            const rewardAmount = 1000000000;

            // 使用useSignAndExecuteTransaction的mutate方法执行交易
            signAndExecuteTransaction(
              createDirectRewardParams(
                TESTNET_QUIZMANAGER_ID,
                currentAccount.address,
                rewardAmount
              ),
              {
                onSuccess: (result) => {
                  console.log("奖励积分成功!", result);
                },
                onError: (error) => {
                  console.error("奖励积分失败:", error);
                },
              }
            );
          } catch (walletError) {
            console.error("调用钱包或合约失败:", walletError);
          }
        }
      }
    } catch (error) {
      console.error("验证答案失败", error);
      setShowAnswer(true);
    }
  };

  const handleViewSolution = async () => {
    try {
      const userId = localStorage.getItem("userId") || "default";
      const result = await getQuestionSolution({
        questionIndex: currentQuestionIndex,
        userId: userId,
      });

      if (result.status === "success") {
        // 设置答案结果
        setAnswerResult({
          isCorrect:
            selectedOption !== null &&
            isCorrectOption(
              result.data.answer,
              selectedOption,
              result.data.correctOptionLetter
            ),
          correctAnswer: result.data.answer,
          correctOptionLetter: result.data.correctOptionLetter,
          explanation: result.data.explanation,
        });
        setShowAnswer(true);

        // 如果用户已登录，调用合约消耗积分查看解析
        if (currentAccount) {
          try {
            // 获取当前问题ID
            const questionId =
              questions[currentQuestionIndex].id || currentQuestionIndex;
            console.log(questionId, "questionId---");

            // 获取解析对象ID
            const solutionId = await getSolutionId(questionId);
            console.log(solutionId, "solutionId---");

            // 如果没有用户代币ID，重新获取
            if (!userCoinId) {
              const coinId = await getUserCoinId(currentAccount.address);
              setUserCoinId(coinId);
            }

            // 如果成功获取了必要的ID，进行交易
            if (solutionId && userCoinId) {
              // 创建交易
              const transaction = createViewSolutionTransaction(
                solutionId,
                userCoinId
              );

              // 执行交易
              signAndExecuteTransaction(
                { transaction },
                {
                  onSuccess: (result) => {
                    console.log("查看解析成功!", result);
                  },
                  onError: (error) => {
                    console.error("查看解析失败:", error);
                  },
                }
              );
            } else {
              console.log("缺少必要的ID信息，跳过链上交易");
            }
          } catch (error) {
            console.error("调用合约查看解析失败:", error);
          }
        }
      }
    } catch (error) {
      console.error("获取答案解析失败", error);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setScore(0);
    setQuizCompleted(false);
    setShowAnswer(false);
    setAnswerResult(null);
  };

  // 添加简化问题到链上的示例函数
  const handleAddSimpleQuestion = async () => {
    if (!currentAccount) {
      console.error("用户未登录");
      return;
    }

    try {
      // 这里应该获取问题注册表ID
      const registryId = TESTNET_REGISTRY_ID; // 使用测试网络的注册表ID

      // 创建一个问题示例
      const question = {
        content:
          "Move语言中，以下哪个关键字用于声明模块？\nA. struct\nB. resource\nC. module\nD. function",
      };

      // 使用签名执行交易的mutate方法来添加问题
      signAndExecuteTransaction(
        createAddSimpleQuestionParams(registryId, question.content),
        {
          onSuccess: (result) => {
            console.log("简化问题添加成功!", result);
            // 这里可以解析返回的结果获取问题ID
            // 前端自己存储选项和正确答案，不上传到链上
          },
          onError: (error) => {
            console.error("简化问题添加失败:", error);
          },
        }
      );
    } catch (error) {
      console.error("添加简化问题失败:", error);
    }
  };

  if (loading) {
    return (
      <div className="quiz-loading">
        <div className="loading-spinner"></div>
        <h2 className="loading-text">一大波题库正在来临...</h2>
      </div>
    );
  }

  if (quizCompleted) {
    return (
      <div className="quiz-completed">
        <h2>测验完成！</h2>
        <p>
          您的分数: {score} / {questions.length}
        </p>
        <div className="quiz-actions">
          <button onClick={resetQuiz}>重新开始</button>
          <Link to="/" className="home-link">
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  // 如果没有题目，显示加载中
  if (!currentQuestion) {
    return (
      <div className="quiz-loading">
        <div className="loading-spinner"></div>
        <h2 className="loading-text">加载题目中...</h2>
      </div>
    );
  }

  return (
    <div className="quiz-container">
      {/* 显示用户代币余额 */}
      {currentAccount && (
        <div
          className="token-balance"
          style={{
            position: "absolute",
            top: "10px",
            right: "20px",
            background: "#f0f0f0",
            padding: "5px 10px",
            borderRadius: "5px",
            fontSize: "14px",
          }}
        >
          <p>
            积分余额: <strong>{userTokenBalance}</strong> POINT
          </p>
          <Button
            onClick={refreshTokenBalance}
            size="sm"
            style={{ marginLeft: "5px", padding: "2px 5px", fontSize: "12px" }}
          >
            刷新
          </Button>
        </div>
      )}

      <div className="quiz-progress">
        <div
          className="progress-bar"
          style={{
            width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
          }}
        ></div>
      </div>

      <div className="quiz-header">
        <p>
          问题 {currentQuestionIndex + 1} / {questions.length}
        </p>
      </div>

      <div className="quiz-question">
        <h3>{currentQuestion.question}</h3>

        <div className="quiz-options">
          {currentQuestion.options.map((option, index) => (
            <div
              key={index}
              className={`quiz-option ${
                selectedOption === index ? "selected" : ""
              } 
                          ${
                            showAnswer &&
                            answerResult &&
                            isCorrectOption(
                              answerResult.correctAnswer,
                              index,
                              answerResult.correctOptionLetter
                            )
                              ? "correct"
                              : ""
                          } 
                          ${
                            showAnswer &&
                            selectedOption === index &&
                            answerResult &&
                            !answerResult.isCorrect
                              ? "incorrect"
                              : ""
                          }`}
              onClick={() => !showAnswer && handleOptionSelect(index)}
            >
              <span className="option-letter">
                {String.fromCharCode(65 + index)}
              </span>
              <span className="option-text">{option}</span>
            </div>
          ))}
        </div>

        {showAnswer && answerResult && (
          <div className="answer-explanation">
            <p>{answerResult.isCorrect ? "✓ 回答正确!" : "✗ 回答错误!"}</p>
            {answerResult.correctOptionLetter && (
              <p className="correct-answer">
                正确答案：{answerResult.correctOptionLetter}
              </p>
            )}
            {answerResult.explanation && (
              <p className="explanation-text">{answerResult.explanation}</p>
            )}
          </div>
        )}

        <div className="quiz-actions">
          {selectedOption !== null && !showAnswer && (
            <Button onClick={handleCheckAnswer}>检查答案</Button>
          )}
          <Button onClick={handleViewSolution}>答案与解析</Button>
          {showAnswer && (
            <Button onClick={handleNextQuestion}>
              {currentQuestionIndex < questions.length - 1
                ? "下一题"
                : "完成测验"}
            </Button>
          )}
        </div>
      </div>

      {/* 添加问题按钮，仅在开发环境显示 */}
      {process.env.NODE_ENV === "development" && (
        <div
          className="admin-buttons"
          style={{ marginTop: "20px", display: "flex", gap: "10px" }}
        >
          <Button
            onClick={handleAddSimpleQuestion}
            className="admin-button"
            style={{ background: "#2196F3" }}
          >
            添加简化问题（不含答案和解析）
          </Button>
        </div>
      )}
    </div>
  );
};

// 辅助函数，判断选项是否为正确选项
const isCorrectOption = (
  correctAnswer: string | number,
  optionIndex: number,
  correctOptionLetter?: string
): boolean => {
  // 如果有提供correctOptionLetter，优先使用字母判断
  if (correctOptionLetter) {
    const letterIndex = correctOptionLetter.charCodeAt(0) - 65; // 'A'的ASCII码是65
    return optionIndex === letterIndex;
  }

  // 以下是原有逻辑，作为备选判断方式
  if (typeof correctAnswer === "number") {
    return optionIndex === correctAnswer;
  } else if (typeof correctAnswer === "string") {
    // 检查是否以字母前缀开头 (如 A. B. C. 等)
    if (/^[A-D]\.?\s/.test(correctAnswer)) {
      const letterIndex = correctAnswer.charCodeAt(0) - 65; // 'A' 的 ASCII 码是 65
      return optionIndex === letterIndex;
    }
    // 直接匹配内容
    const optionLetter = String.fromCharCode(65 + optionIndex);
    return (
      correctAnswer.startsWith(optionLetter) ||
      correctAnswer.toLowerCase().includes(optionLetter.toLowerCase())
    );
  }
  return false;
};

export default Quiz;
