import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import MobileTopbar from './MobileTopbar';
import Header from './Header';
import BottomNav from './BottomNav';

export default function Layout({ children }) {
  const location = useLocation();
  const isFocusMode = ['/focus', '/deep-focus', '/analytics'].includes(location.pathname);

  useEffect(() => {
    const bodyClasses = ['index-page', 'themes-page', 'focus-mode'];
    document.body.classList.remove(...bodyClasses);

    if (location.pathname === '/') {
      document.body.classList.add('index-page');
    } else if (location.pathname === '/themes') {
      document.body.classList.add('themes-page');
    } else if (isFocusMode) {
      document.body.classList.add('focus-mode');
    }

    return () => {
      document.body.classList.remove(...bodyClasses);
    };
  }, [location.pathname, isFocusMode]);

  if (isFocusMode) {
    return <>{children}</>;
  }

  return (
    <>
      <MobileTopbar />
      <Header />
      <div className="page-container">
        <main className="content">
          {children}
        </main>
      </div>
      <BottomNav />
    </>
  );
}
