import { useState } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");

  async function greet() {
    setGreetMsg(await invoke("greet", { name }));
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <h1 className="text-3xl font-bold mb-6">Welcome to Tauri + React</h1>

      <div className="flex gap-6 mb-6">
        <a href="https://vite.dev" target="_blank" className="transition hover:drop-shadow-[0_0_2em_#747bff]">
          <img src="/vite.svg" className="h-24 p-4" alt="Vite logo" />
        </a>
        <a href="https://tauri.app" target="_blank" className="transition hover:drop-shadow-[0_0_2em_#24c8db]">
          <img src="/tauri.svg" className="h-24 p-4" alt="Tauri logo" />
        </a>
        <a href="https://react.dev" target="_blank" className="transition hover:drop-shadow-[0_0_2em_#61dafb]">
          <img src={reactLogo} className="h-24 p-4" alt="React logo" />
        </a>
      </div>
      <p className="mb-4 text-gray-600 dark:text-gray-400">Click on the Tauri, Vite, and React logos to learn more.</p>

      <form
        className="flex gap-2 mb-4"
        onSubmit={(e) => {
          e.preventDefault();
          greet();
        }}
      >
        <input
          className="rounded-lg border border-gray-300 px-4 py-2 text-base shadow-sm outline-none focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
          onChange={(e) => setName(e.currentTarget.value)}
          placeholder="Enter a name..."
        />
        <button
          type="submit"
          className="rounded-lg border border-transparent bg-white px-4 py-2 text-base font-medium shadow-sm cursor-pointer transition hover:border-blue-500 active:bg-gray-200 dark:bg-gray-800 dark:text-white dark:active:bg-gray-700"
        >
          Greet
        </button>
      </form>
      <p className="text-lg font-medium text-blue-600 dark:text-blue-400">{greetMsg}</p>
    </main>
  );
}

export default App;
