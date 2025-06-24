import React from 'react';
import styled from 'styled-components';

const Loader = () => {
  return (
    <StyledWrapper>
      <div className="loader" />
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .loader {
    position: relative;
    transform: scale(2);
    border-radius: 50%;
    border: 1px solid;
    width: 30px;
    height: 30px;
    color: white;
    
    margin: 20% 45%;
  }

  .loader::after {
    position: absolute;
    width: 0px;
    height: 10px;
    display: block;
    border-left: 1px solid #fff;
    content: '';
    left: 14px;
    border-radius: 1px;
    top: 4px;
    animation-duration: 1s;
  }

  .loader::before {
    position: absolute;
    width: 0px;
    height: 10px;
    display: block;
    border-left: 1px solid #fff;
    content: '';
    left: 14px;
    border-radius: 1px;
    top: 4px;
    animation-duration: 40s;
  }

  .loader::before,.loader::after {
    transform-origin: bottom;
    animation-name: dial;
    animation-iteration-count: infinite;
    animation-timing-function: linear;
  }

  @keyframes dial {
    0% {
      transform: rotate(0deg);
    }

    100% {
      transform: rotate(360deg);
    }
  }`;

export default Loader;
    