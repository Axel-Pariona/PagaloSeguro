import { useAuth } from '../../context/AuthContext'

export default function Navbar() {
  const { user, signOut } = useAuth()

  const handleLogout = async () => {
    await signOut()
  }

  return (
    <header className="navbar">
      <div>
        <h2>PagaloSeguro</h2>
        <span>Laboratorio de pagos seguros</span>
      </div>

      <div className="navbar-user">
        <span>{user?.email}</span>
        <button onClick={handleLogout}>Cerrar sesión</button>
      </div>
    </header>
  )
}