import Navbar from './Navbar';
import Footer from './Footer';
import BottomNav from './BottomNav';

function Layout({ children }) {
  return (
    <div className="site-layout">
      <Navbar />
      <main className="site-main">{children}</main>
      <Footer />
      <BottomNav />
    </div>
  );
}

export default Layout;