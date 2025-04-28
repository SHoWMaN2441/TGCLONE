import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="w-[full] mx-auto flex h-screen items-center justify-center bg-teal-300">
      <div className="flex gap-5 justify-center items-center">
        <Link to="/Chat" target="_blank">
          <div
            style={{ textDecoration: "none" }}
            className="bg-[url('./image.png')] text-white bg-cover bg-center w-[400px] h-[300px] hover:scale-110 transition shadow-lg rounded-lg flex flex-col items-center justify-end p-4 m-4 hover:shadow-xl duration-300 ease-in-out"
          >
            <h2>CHAT APP</h2>
          </div>
        </Link>

        <a
          href="https://mini-gamesashdr.netlify.app/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <div className="bg-[url('./forback.png')] object-contain text-white bg-cover bg-center w-[400px] h-[300px] hover:scale-110 transition shadow-lg rounded-lg flex flex-col items-center justify-end p-4 m-4 hover:shadow-xl duration-300 ease-in-out">
            <h2>GAMEHUB</h2>
          </div>
        </a>
      </div>
    </div>
  );
};

export default Home;
