import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHOC, CustomInput, CustomButton } from "../components";
import { useGlobalContext } from "../context";
import { use } from "react";

const Home = () => {
  const { contract, walletAddress, setShowAlert, gameData, setErrorMessage } =
    useGlobalContext();
  const [playerName, setPlayerName] = useState("");
  const navigate = useNavigate();

  const handleClick = async () => {
    if (!contract) {
      alert("Contract not ready yet. Please wait a few seconds and try again.");
      return;
    }
    try {
      console.log({ contract });
      const playerExists = await contract.isPlayer(walletAddress);

      if (!playerExists) {
        await contract.registerPlayer(playerName, playerName, {
          gasLimit: 200000,
        });

        setShowAlert({
          status: true,
          type: "info",
          message: `${playerName} is being summoned.`,
        });
      } else {
        setShowAlert({
          status: true,
          type: "info",
          message: `This account is already registered.`,
        });
      }
    } catch (error) {
      setErrorMessage(error);
    }
  };

  useEffect(() => {
    const createPlayerToken = async () => {
      const playerExists = await contract.isPlayer(walletAddress);
      const playerTokenExists = await contract.isPlayerToken(walletAddress);

      console.log({ playerExists, playerTokenExists });

      if (playerExists && playerTokenExists) navigate("/create-battle");
    };

    if (contract) createPlayerToken();
  }, [contract]);

  useEffect(() => {
    if (gameData?.activeBattle?.name)
      navigate(`/battle/${gameData.activeBattle.name}`);
  }, [gameData]);

  return (
    <div className="flex flex-col">
      <CustomInput
        label="Name"
        placeHolder="Enter your player name"
        value={playerName}
        handleValueChange={setPlayerName}
      />

      <CustomButton
        title="Register"
        handleClick={handleClick}
        restStyles="mt-6"
        disabled={!contract}
      />
    </div>
  );
};

export default PageHOC(
  Home,
  <>
    Welcome to Avax Gods <br /> A Web3 NFT Card Game
  </>,
  <>
    Connect your Wallet to start playing <br /> The Ultimate Web3 Battle Card
    Game
  </>
);
