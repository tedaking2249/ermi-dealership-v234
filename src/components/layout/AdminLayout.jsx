import AdminNavbar from './AdminNavbar';

function AdminLayout({ children }) {
  return (
    <>
      <AdminNavbar />
      <main>{children}</main>
    </>
  );
}

export default AdminLayout;
