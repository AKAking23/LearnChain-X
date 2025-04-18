import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { sendMessageToCoze, verifyAnswer } from "../api/coze";
import "../styles/Quiz.css"; // 需要创建这个CSS文件

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
    explanation?: string;
  } | null>(null);

  useEffect(() => {
    const fetchQuizQuestions = async () => {
      try {
        setLoading(true);
        // 从localStorage检查是否已经缓存了题目
        const cachedQuestions = localStorage.getItem("quizQuestions");
        // 生成或获取用户ID
        const userId = localStorage.getItem("userId") || `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        localStorage.setItem("userId", userId);

        if (cachedQuestions) {
          setQuestions(JSON.parse(cachedQuestions));
          setLoading(false);
        } else {
          // 如果没有缓存，则调用API获取题目
          const response = await sendMessageToCoze({
            input: "请生成3道区块链相关的选择题，每道题有4个选项，格式为JSON数组",
            userId: userId
          });
          
          // 处理返回的数据
          if (response.status === "success") {
            let questions = [];
            
            // 尝试从不同位置提取题目数据
            if (response.data?.output && Array.isArray(response.data.output)) {
              // 标准格式
              questions = response.data.output;
            } else if (typeof response.data === 'string') {
              // 如果data是字符串，尝试解析
              try {
                const parsedData = JSON.parse(response.data);
                questions = Array.isArray(parsedData) ? parsedData : 
                           (parsedData.output && Array.isArray(parsedData.output) ? parsedData.output : []);
              } catch (e) {
                console.error("解析字符串数据失败", e);
              }
            }
            
            if (questions.length > 0) {
              setQuestions(questions);
              // 缓存到localStorage
              localStorage.setItem('quizQuestions', JSON.stringify(questions));
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
        question: "比特币的创始人是谁？",
        options: [
          "Vitalik Buterin",
          "Satoshi Nakamoto",
          "Charles Hoskinson",
          "Gavin Wood",
        ],
      },
      {
        question: "以太坊网络中用于支付计算资源的货币单位是？",
        options: ["Ether", "Gas", "Wei", "Gwei"],
      },
      {
        question: "区块链的基本数据结构是什么？",
        options: ["链表", "数组", "哈希表", "默克尔树"],
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
        userId: userId
      });
      
      if (result.status === "success") {
        setAnswerResult(result.data);
        setShowAnswer(true);
        
        // 如果答案正确，增加分数
        if (result.data.isCorrect) {
          setScore(score + 1);
        }
      }
    } catch (error) {
      console.error("验证答案失败", error);
      setShowAnswer(true);
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
                            isCorrectOption(answerResult.correctAnswer, index)
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
            {answerResult.explanation && (
              <p className="explanation-text">{answerResult.explanation}</p>
            )}
          </div>
        )}

        <div className="quiz-actions">
          {selectedOption !== null && !showAnswer && (
            <button onClick={handleCheckAnswer}>检查答案</button>
          )}
          {showAnswer && (
            <button onClick={handleNextQuestion}>
              {currentQuestionIndex < questions.length - 1
                ? "下一题"
                : "完成测验"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// 辅助函数，判断选项是否为正确选项
const isCorrectOption = (correctAnswer: string | number, optionIndex: number): boolean => {
  if (typeof correctAnswer === 'number') {
    return optionIndex === correctAnswer;
  } else if (typeof correctAnswer === 'string') {
    // 检查是否以字母前缀开头 (如 A. B. C. 等)
    if (/^[A-D]\.?\s/.test(correctAnswer)) {
      const letterIndex = correctAnswer.charCodeAt(0) - 65; // 'A' 的 ASCII 码是 65
      return optionIndex === letterIndex;
    }
    // 直接匹配内容
    const optionLetter = String.fromCharCode(65 + optionIndex);
    return correctAnswer.startsWith(optionLetter) || 
           correctAnswer.toLowerCase().includes(optionLetter.toLowerCase());
  }
  return false;
};

export default Quiz;
