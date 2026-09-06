import MobileTopbar from './MobileTopbar';
import Header from './Header';
import BottomNav from './BottomNav';

export default function Layout({ children }) {
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
