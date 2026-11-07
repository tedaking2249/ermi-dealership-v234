import { Link, useLocation } from 'react-router-dom';
import SiteInfo from './SiteInfo';
import { siteInfo } from '../../data/siteInfo';
import { infoTarget } from '../../utils/infoLink';
import { useLanguage } from '../../context/LanguageContext';
import './SiteFooter.css';

// The About and Contact section shows at the very bottom of these pages
const INFO_PAGES = ['/', '/inventory'];

function Footer() {
  const { pathname } = useLocation();
  const { t } = useLanguage();

  return (
    <>
      {INFO_PAGES.includes(pathname) && <SiteInfo />}

      <footer className="site-footer">
        <div className="site-footer-inner">
          <nav className="site-footer-links" aria-label="Footer">
            <Link to="/inventory">{t('footer.inventory')}</Link>
            <Link to="/sell">{t('footer.sell')}</Link>
            <Link to={infoTarget(pathname, '#about')}>{t('footer.about')}</Link>
            <Link to={infoTarget(pathname, '#contact')}>{t('footer.contact')}</Link>
          </nav>
          <p>&copy; {new Date().getFullYear()} {siteInfo.name}. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}

export default Footer;