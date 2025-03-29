import React, { useEffect } from 'react';
import { useStore } from 'effector-react';
import { $currentTime, $showEasterEgg, hideEasterEgg } from '@src/models/timeEgg';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';

// 彩蛋动画效果的CSS
const popIn = keyframes`
  0% {
    transform: scale(0);
    opacity: 0;
  }
  70% {
    transform: scale(1.2);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

const fadeOut = keyframes`
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
`;

const TimeDisplayContainer = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  font-family: Arial, sans-serif;
  font-size: 16px;
  z-index: 9999;
  pointer-events: none;
`;

const EasterEggContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: ${popIn} 0.5s ease-out forwards, ${fadeOut} 0.5s ease-in forwards 3s;
  pointer-events: none;
`;

const EasterEggContent = styled.div`
  background-color: rgba(255, 215, 0, 0.9);
  color: #333;
  padding: 30px 50px;
  border-radius: 20px;
  font-size: 36px;
  font-weight: bold;
  box-shadow: 0 0 30px rgba(255, 215, 0, 0.8);
  text-align: center;
  transform: rotate(-5deg);
`;

const TimeDisplay: React.FC = () => {
  const currentTime = useStore($currentTime);
  const showEasterEgg = useStore($showEasterEgg);

  // 彩蛋显示后5秒自动隐藏
  useEffect(() => {
    if (showEasterEgg) {
      const timer = setTimeout(() => {
        hideEasterEgg();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [showEasterEgg]);

  return (
    <>
      <TimeDisplayContainer>
        {currentTime}
      </TimeDisplayContainer>
      
      {showEasterEgg && (
        <EasterEggContainer>
          <EasterEggContent>
            🎉 恭喜你发现彩蛋！ 🎉
            <div style={{ fontSize: '18px', marginTop: '10px' }}>
              在时间点 {currentTime} 的特别惊喜
            </div>
          </EasterEggContent>
        </EasterEggContainer>
      )}
    </>
  );
};

export default TimeDisplay; 