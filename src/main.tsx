import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { LazyMotion, MotionConfig, domAnimation } from 'motion/react';

createRoot(document.getElementById('root')!).render(
  <MotionConfig reducedMotion="user" transition={{ duration: .24, ease: [.16, 1, .3, 1] }}>
    <LazyMotion features={domAnimation} strict>
      <App />
    </LazyMotion>
  </MotionConfig>
);
