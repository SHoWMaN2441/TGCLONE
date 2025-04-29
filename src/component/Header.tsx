import { Link } from "react-router-dom";

const Header = () => {
  return (
    <div className="w-full h-16 bg-gray-800 flex items-center justify-between px-4 text-white">
      <Link
        style={{ textDecoration: "none", color: "inherit" }}
        to="/"
        className="flex items-center"
      >
        <div className="text-2xl font-bold cursor-pointer">ASHDR PROJECT</div>
      </Link>
      <div>
        <ul className="flex items-center gap-5">
          <Link
            style={{ textDecoration: "none", color: "inherit" }}
            to="https://mini-gamesashdr.netlify.app/"
            target="_blank"
          >
            <li className="scale-110 text-lg font-bold cursor-pointer">
              Our Games
            </li>
          </Link>
          <li className="scale-110 text-lg font-bold cursor-pointer"></li>
        </ul>
      </div>
    </div>
  );
};

export default Header;
