import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import { ethers } from "ethers";
import Web3Modal from "web3modal";
import { useNavigate } from "react-router-dom";

import { ABI, ADDRESS } from "../contract";
import { createEventListeners } from "./createEventListeners";
import { GetParams } from "../utils/onboard";

const GlobalContext = createContext();

export const GlobalContextProvider = ({ children }) => {
  const [walletAddress, setWalletAddress] = useState("");
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);
  const [showAlert, setShowAlert] = useState({
    status: false,
    type: "info",
    message: "",
  });
  const [battleName, setBattleName] = useState("");
  const [gameData, setGameData] = useState({
    players: [],
    pendingBattles: [],
    activeBattle: null,
  });
  const [updateGameData, setUpdateGameData] = useState(0);
  const [battleGround, setBattleGround] = useState("bg-astral");
  const [step, setStep] = useState(1);
  const [errorMessage, setErrorMessage] = useState("");

  const player1Ref = useRef();
  const player2Ref = useRef();

  const navigate = useNavigate();

  //* Set battleground to local storage
  useEffect(() => {
    const isBattleground = localStorage.getItem("battleground");

    if (isBattleground) {
      setBattleGround(isBattleground);
    } else {
      localStorage.setItem("battleground", battleGround);
    }
  }, []);

  //* Reset web3 onboarding modal params
  useEffect(() => {
    const resetParams = async () => {
      const currentStep = await GetParams();

      setStep(currentStep.step);
    };

    resetParams();

    window?.ethereum?.on("chainChanged", () => resetParams());
    window?.ethereum?.on("accountsChanged", () => resetParams());
  }, []);

  // ✅ SINGLE source of truth: Web3Modal
  useEffect(() => {
    const connectWallet = async () => {
      try {
        const web3Modal = new Web3Modal({
          cacheProvider: true,
        });

        const connection = await web3Modal.connect();
        const newProvider = new ethers.providers.Web3Provider(connection);
        const signer = newProvider.getSigner();
        const address = await signer.getAddress();

        const newContract = new ethers.Contract(ADDRESS, ABI, signer);

        setProvider(newProvider);
        setWalletAddress(address);
        setContract(newContract);

        console.log("✅ Wallet connected:", address);
        console.log("✅ Contract ready:", newContract);
      } catch (error) {
        console.log("❌ Wallet connection failed:", error.message);
      }
    };

    connectWallet();
  }, []);

  // Event listeners
  useEffect(() => {
    if (step != -1 && contract) {
      createEventListeners({
        navigate,
        contract,
        provider,
        walletAddress,
        setShowAlert,
        setUpdateGameData,
        player1Ref,
        player2Ref,
      });
    }
  }, [contract, step]);

  //* Set the game data to the state
  useEffect(() => {
    const fetchGameData = async () => {
      if (contract) {
        const fetchedBattles = await contract.getAllBattles();
        const pendingBattles = fetchedBattles.filter(
          (battle) => battle.battleStatus === 0
        );
        let activeBattle = null;

        fetchedBattles.forEach((battle) => {
          if (
            battle.players.find(
              (player) => player.toLowerCase() === walletAddress.toLowerCase()
            )
          ) {
            if (battle.winner.startsWith("0x00")) {
              activeBattle = battle;
            }
          }
        });

        setGameData({ pendingBattles: pendingBattles.slice(1), activeBattle });
        console.log({ fetchedBattles });
      }
    };

    fetchGameData();
  }, [contract, updateGameData]);

  // Alerts (tutorial-compatible)
  useEffect(() => {
    if (showAlert?.status) {
      const timer = setTimeout(() => {
        setShowAlert({ status: false, type: "info", message: "" });
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [showAlert]);

  //* Handle error messages
  useEffect(() => {
    if (errorMessage) {
      const parsedErrorMessage = errorMessage?.reason
        ?.slice("execution reverted: ".length)
        .slice(0, -1);

      if (parsedErrorMessage) {
        setShowAlert({
          status: true,
          type: "failure",
          message: parsedErrorMessage,
        });
      }
    }
  }, [errorMessage]);

  return (
    <GlobalContext.Provider
      value={{
        contract,
        walletAddress,
        provider,
        showAlert,
        setShowAlert,
        battleName,
        setBattleName,
        gameData,
        battleGround,
        setBattleGround,
        errorMessage,
        setErrorMessage,
        player1Ref,
        player2Ref,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobalContext = () => useContext(GlobalContext);
