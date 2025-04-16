import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { useNavigate } from 'react-router-dom';
import './Dashbord.module.css';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(true);
  const [playerActive, setPlayerActive] = useState(false); // 替代globalStore.player.if_active
  const containerRef = useRef<HTMLDivElement>(null);
  const middleRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const bigballRef = useRef<HTMLDivElement>(null);
  const smallballsRefs = useRef<HTMLDivElement[]>([]);
  const lineRef = useRef<SVGSVGElement>(null);
  const ballsRef = useRef<HTMLDivElement>(null);
  const titleLettersRefs = useRef<HTMLParagraphElement[]>([]);
  const navRef = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLParagraphElement>(null);
  const animaterRef = useRef<gsap.core.Timeline | null>(null);
  const maxDistanceRef = useRef<number>(0);
  
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent) 
    && !navigator.userAgent.includes('CriOS') 
    && !(window as any).InstallTrigger;

  // 重置welcome动画样式
  const reset = () => {
    gsap.timeline()
      .set(lineRef.current, {
        scale: 0,
        opacity: 1,
      })
      .set(ballsRef.current, {
        scale: 0,
        opacity: 1,
      })
      .set(titleLettersRefs.current, {
        clipPath: "circle(0%)",
        y: "50%",
      })
      .set([navRef.current, infoRef.current], {
        opacity: 0,
      });
    
    if (navRef.current) {
      navRef.current.classList.remove("welcome_nav_show");
    }
  };

  // 显示welcome
  const show = () => {
    // 动画播放器存在且正在播放动画：不执行函数，否则会因为动画冲突导致BUG
    if (animaterRef.current && animaterRef.current.isActive()) return;
    
    reset(); // 重置
    setIsVisible(true); // 显示welcome
    
    // 播放动画
    animaterRef.current = gsap.timeline()
      .to(lineRef.current, {
        scale: 1,
        duration: 1.5,
        ease: "power3.inOut",
      })
      .to(
        ballsRef.current,
        {
          scale: 1,
          duration: 1.5,
          ease: "power3.inOut",
        },
        "<0.3"
      )
      .to(
        titleLettersRefs.current,
        {
          clipPath: "circle(100%)",
          y: 0,
          duration: 0.8,
          ease: "power3.out",
          stagger: {
            each: 0.05,
            from: "random",
          },
        },
        "<0.8"
      )
      .to(
        [navRef.current, infoRef.current],
        {
          opacity: 1,
          duration: 1.2,
          ease: "power3.out",
          onStart: () => {
            // nav选项栏因为要适应不同尺寸以旋转，所以不能直接用gsap控制，否则无法响应旋转角度
            // 这里只能用类名控制，welcome_nav_show会根据不同尺寸而通过媒体查询改变角度
            navRef.current?.classList.add("welcome_nav_show");
          },
        },
        "<"
      );
  };

  // 隐藏welcome
  const hidden = (immediate?: () => void, next?: () => void) => {
    // 动画播放器存在且正在播放动画：不执行函数，否则会因为动画冲突导致BUG
    if (animaterRef.current && animaterRef.current.isActive()) return;
    
    if (immediate) immediate(); // 存在立即执行代码，则立即执行
    
    // 播放动画
    animaterRef.current = gsap.timeline()
      .to(lineRef.current, {
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
      })
      .to(
        ballsRef.current,
        {
          opacity: 0,
          duration: 0.8,
          ease: "power3.out",
        },
        "<"
      )
      .to(
        titleLettersRefs.current,
        {
          clipPath: "circle(0%)",
          y: "-50%",
          duration: 0.5,
          ease: "power3.out",
          stagger: {
            each: 0.03,
            from: "random",
          },
        },
        "<"
      )
      .to(
        [navRef.current, infoRef.current],
        {
          opacity: 0,
          duration: 0.8,
          ease: "power3.out",
          onComplete: () => {
            setIsVisible(false); // 隐藏welcome
            if (next) next(); // 如果有后续函数，则执行
          },
        },
        "<"
      );
  };

  // 移动标题文字
  const moveTitle = (x: number, y: number) => {
    // 更新距离:以屏幕中心为基准。将距离与屏幕尺寸绑定：避免不同尺寸下移动距离差异过大
    const distanceX = ((x - window.innerWidth / 2) / window.innerWidth) * 40;
    const distanceY = ((y - window.innerHeight / 2) / window.innerHeight) * 40;
    
    // 移动标题
    gsap.to(titleRef.current, {
      x: `${distanceX}px`,
      y: `${distanceY}px`,
      duration: 3,
      ease: "power3.out",
    });
  };

  // 移动小球
  const moveSmallballs = (x: number, y: number) => {
    // 更新距离:以屏幕中心为基准
    let distanceX = x - window.innerWidth / 2;
    let distanceY = y - window.innerHeight / 2;
    
    // 限制移动边界
    distanceX = Math.min(maxDistanceRef.current, Math.max(-maxDistanceRef.current, distanceX));
    distanceY = Math.min(maxDistanceRef.current, Math.max(-maxDistanceRef.current, distanceY));
    
    // 移动小球
    gsap.to(smallballsRefs.current, {
      x: `${distanceX}px`,
      y: `${distanceY}px`,
      duration: 1,
      ease: "power3.out",
      stagger: 0.1,
    });
  };

  // 导航函数替代全局存储的方法
  const startNewGame = () => {
    hidden(undefined, () => navigate('/game/new'));
  };
  
  const continueGame = () => {
    if (playerActive) {
      hidden(undefined, () => navigate('/game/continue'));
    }
  };
  
  const showRank = () => {
    hidden(undefined, () => navigate('/rank'));
  };
  
  const showInstructions = () => {
    hidden(undefined, () => navigate('/instructions'));
  };

  // 调整尺寸
  const handleResize = () => {
    if (bigballRef.current) {
      // 小球的移动范围局限在大球的周围
      maxDistanceRef.current = bigballRef.current.offsetWidth / 2.5;
    }
  };

  useEffect(() => {
    // 检查是否有活跃玩家存档
    // 这里可以添加从localStorage或API获取玩家状态的逻辑
    const checkPlayerActive = async () => {
      // 示例：检查localStorage中是否有玩家数据
      const playerData = localStorage.getItem('playerData');
      setPlayerActive(!!playerData);
    };
    
    checkPlayerActive();
    
    // 绑定相关事件
    const bindEvents = () => {
      const container = containerRef.current;
      const middle = middleRef.current;
      
      if (container) {
        // 在界面范围内：标题文字跟随鼠标/手指偏移
        container.onmousemove = (e: MouseEvent) => {
          moveTitle(e.x, e.y);
        };
        container.ontouchmove = (e: TouchEvent) => {
          moveTitle(e.touches[0].clientX, e.touches[0].clientY);
        };
        // 移动结束后，让标题回到原位，即屏幕中心点
        container.onmouseout = () => {
          moveTitle(window.innerWidth / 2, window.innerHeight / 2);
        };
        container.ontouchend = () => {
          moveTitle(window.innerWidth / 2, window.innerHeight / 2);
        };
      }
      
      if (middle) {
        // 在靠近中间内容的范围内：小球跟随鼠标/手指偏移，形成融球效果
        middle.onmousemove = (e: MouseEvent) => {
          moveSmallballs(e.x, e.y);
        };
        middle.ontouchmove = (e: TouchEvent) => {
          moveSmallballs(e.touches[0].clientX, e.touches[0].clientY);
        };
        // 移动结束后，让小球回到原位，即屏幕中心点
        middle.onmouseout = () => {
          moveSmallballs(window.innerWidth / 2, window.innerHeight / 2);
        };
        middle.ontouchend = () => {
          moveSmallballs(window.innerWidth / 2, window.innerHeight / 2);
        };
      }
    };

    // 初始化
    handleResize();
    bindEvents();
    
    // 显示欢迎界面
    show();

    // 添加window的resize事件监听
    window.addEventListener('resize', handleResize);

    // 清理函数
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className={`welcome _fullscreen ${!isVisible ? '_hidden' : ''}`} ref={containerRef}>
      <div className="welcome_middle" ref={middleRef}>
        <div className="welcome_middle_title" ref={titleRef}>
          <div>
            {'SNAKE'.split('').map((letter, index) => (
              <p 
                className="_font_6" 
                key={letter + index}
                ref={el => {
                  if (el && !titleLettersRefs.current.includes(el)) {
                    titleLettersRefs.current.push(el);
                  }
                }}
              >
                {letter}
              </p>
            ))}
          </div>
          <div>
            {'BALL'.split('').map((letter, index) => (
              <p 
                className="_font_6" 
                key={letter + index}
                ref={el => {
                  if (el && !titleLettersRefs.current.includes(el)) {
                    titleLettersRefs.current.push(el);
                  }
                }}
              >
                {letter}
              </p>
            ))}
          </div>
        </div>
        <p className="welcome_middle_info _font_3" ref={infoRef}>
          Let's bump up! dodge, bump, reset, and score!
        </p>
        {/* safari浏览器对css的filter适配不友好，这里检测到如果是safari浏览器，则取消滤镜融球效果 */}
        <div 
          className={`welcome_middle_balls ${!isSafari ? 'welcome_middle_balls_filter' : ''}`}
          ref={ballsRef}
        >
          <div 
            className="welcome_middle_balls_big _middle_ball"
            ref={bigballRef}
          ></div>
          {[1, 1.5, 1.2].map((scale, index) => (
            <div 
              className="welcome_middle_balls_small" 
              style={{ '--s': scale } as React.CSSProperties}
              key={index}
              ref={el => {
                if (el && !smallballsRefs.current.includes(el)) {
                  smallballsRefs.current.push(el);
                }
              }}
            ></div>
          ))}
        </div>
        <svg className="welcome_middle_line" viewBox="0 0 50 50" ref={lineRef}>
          <circle className="_dashed" cx="25" cy="25" r="25" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
      <div className="welcome_nav" ref={navRef}>
        <svg className="welcome_nav_line" viewBox="0 0 50 50">
          <circle className="_dashed" cx="25" cy="25" r="25" vectorEffect="non-scaling-stroke" />
        </svg>
        <div className="welcome_nav_selection" style={{ '--i': 0 } as React.CSSProperties}>
          <div className="wns_node" onClick={startNewGame}>
            <div></div>
            <p className="_font_2">NEW GAME</p>
          </div>
        </div>
        <div className="welcome_nav_selection" style={{ '--i': 1 } as React.CSSProperties}>
          <div 
            className={`wns_node ${!playerActive ? 'wns_unclickable' : ''}`}
            onClick={continueGame}
          >
            <div></div>
            <p className="_font_2">CONTINUE</p>
          </div>
        </div>
        <div className="welcome_nav_selection" style={{ '--i': 2 } as React.CSSProperties}>
          <div className="wns_node" onClick={showRank}>
            <div></div>
            <p className="_font_2">RANK</p>
          </div>
        </div>
        <div className="welcome_nav_selection" style={{ '--i': 3 } as React.CSSProperties}>
          <div className="wns_node" onClick={showInstructions}>
            <div></div>
            <p className="_font_2">INSTRUTION</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 