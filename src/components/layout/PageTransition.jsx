import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { pageVariants } from '../../lib/animations';

export function PageTransition({ children }) {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="w-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// Higher-order component for wrapping pages
export function withPageTransition(Component) {
  return function WrappedComponent(props) {
    return (
      <PageTransition>
        <Component {...props} />
      </PageTransition>
    );
  };
}
