import { NavLink } from 'react-router-dom';

const NavBar = () => {
  return (
    <header className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-xl font-bold">Allbikes</h1>
        <nav>
          <ul className="flex space-x-4">
            <li>
              <NavLink
                to="/"
                className={({ isActive }) =>
                  isActive ? "text-blue-300" : "hover:text-gray-300"
                }
                end
              >
                Home
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/workshop"
                className={({ isActive }) =>
                  isActive ? "text-blue-300" : "hover:text-gray-300"
                }
              >
                Workshop
              </NavLink>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default NavBar;

